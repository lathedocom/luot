const configModels = require('../../config/models');
const tasksConfig = require('../../config/tasks');
const TASK_ROUTING = tasksConfig.TASK_ROUTING || tasksConfig;
const GoogleProvider = require('./providers/google');
const GroqProvider = require('./providers/groq');
const { parseAIResponse } = require('./parser');
const logger = require('../utils/logger');
const budgetManager = require('../../budget/budget_manager'); 
const quotaConfig = require('../../config/quota');

class AIGateway {
    constructor() {
        this.providers = {
            google: new GoogleProvider(configModels.API_KEYS.GEMINI),
            googleBackup: configModels.API_KEYS.GEMINI_BACKUP ? new GoogleProvider(configModels.API_KEYS.GEMINI_BACKUP) : null,
            googleBackup2: configModels.API_KEYS.GEMINI_BACKUP2 ? new GoogleProvider(configModels.API_KEYS.GEMINI_BACKUP2) : null,
            groq: new GroqProvider(configModels.API_KEYS.GROQ)
        };
    }

   async executeTask(taskName, prompt, systemInstruction = "") {
        logger.info(`[Gateway] Đang xử lý task: ${taskName}...`);
        
        const taskConfig = TASK_ROUTING[taskName];
        if (!taskConfig) {
            throw new Error(`Task '${taskName}' chưa được khai báo trong config/tasks.js`);
        }
        let targetModel = taskConfig.model;
        let targetProvider = taskConfig.provider;

        // --- PRE-CHECK QUOTA: chủ động fallback nếu model chính đã gần hết quota ngày ---
        if (targetProvider.startsWith('google') && !budgetManager.canUseModel(targetModel)) {
            logger.warn(`[Gateway] Model ${targetModel} đã gần chạm ngưỡng an toàn quota. Chủ động chuyển sang Groq trước khi gọi.`);
            targetProvider = 'groq';
            targetModel = (taskName === 'DEEP_ANALYSIS' || taskName === 'MATCH_TIMELINE' ||
                           taskName === 'DAILY_BRIEFING' || taskName === 'MONTHLY_REPORT')
                ? (configModels.LAYER2_MODEL_FALLBACK || 'llama-3.3-70b-versatile')
                : (configModels.LAYER1_MODEL_FALLBACK || 'llama-3.1-8b-instant');
        }

        // Tự động tìm và kéo system_prompt từ config/tasks.js nếu không được truyền vào
        let finalSystemInstruction = systemInstruction;
        if (!finalSystemInstruction) {
            const taskDetails = tasksConfig[taskName];
            if (taskDetails && taskDetails.system_prompt) {
                finalSystemInstruction = taskDetails.system_prompt;
            } else if (taskConfig.system_prompt) {
                finalSystemInstruction = taskConfig.system_prompt;
            }
        }
        
        let attempts = 0;
        const maxRetries = 3; 
        
        while (attempts <= maxRetries) {
            const startTime = Date.now();
            try {
                const providerInstance = this.providers[targetProvider];
                if (!providerInstance) throw new Error(`Provider ${targetProvider} không tồn tại.`);
                const resultText = await providerInstance.generateContent(prompt, finalSystemInstruction, targetModel);
                
                budgetManager.recordUsage({
                    model: targetModel,
                    provider: targetProvider,
                    task: taskName,
                    promptTokens: Math.round(prompt.length / 4),
                    completionTokens: Math.round(resultText.length / 4),
                    latency: Date.now() - startTime,
                    status: 'SUCCESS'
                });
                
                return parseAIResponse(resultText);
                
            } catch (error) {
                const latency = Date.now() - startTime;
                logger.warn(`[Gateway] Task ${taskName} (Model: ${targetModel}) bị lỗi: ${error.message}`);
                
                const isQuotaOrNetworkError = error.message === "RATE_LIMIT" || 
                                              error.message.includes('429') || 
                                              error.message.includes('404') || 
                                              error.message.includes('503');
                if (isQuotaOrNetworkError) {
                    if (targetProvider === 'google' && this.providers.googleBackup) {
                        logger.warn(`[Gateway] Phát hiện lỗi API Key chính. Đang chuyển sang Key Dự phòng 1 (googleBackup)...`);
                        targetProvider = 'googleBackup';
                    } 
                    else if (targetProvider === 'googleBackup' && this.providers.googleBackup2) {
                        logger.warn(`[Gateway] Key Dự phòng 1 bị giới hạn. Đang chuyển sang Key Dự phòng 2 (googleBackup2)...`);
                        targetProvider = 'googleBackup2';
                    } 
                    else if (targetProvider.startsWith('google')) {
                        // Với tầng 3 (DAILY_BRIEFING/MONTHLY_REPORT), thử model Google dự phòng
                        // (gemini-2.5-flash) trước khi rớt hẳn xuống Groq, vì đây là các task
                        // chất lượng cao cần giữ nguyên "họ" Gemini nếu còn quota.
                        if ((taskName === 'DAILY_BRIEFING' || taskName === 'MONTHLY_REPORT') &&
                            targetModel !== configModels.LAYER3_MODEL_FALLBACK_1) {
                            logger.warn(`[Gateway] Hết quota model chính tầng 3. Thử model dự phòng Google: ${configModels.LAYER3_MODEL_FALLBACK_1}`);
                            targetModel = configModels.LAYER3_MODEL_FALLBACK_1 || 'gemini-2.5-flash';
                            targetProvider = 'google'; // quay lại key chính, đã đổi model
                        } else {
                            // Đổi CÙNG LÚC cả Provider và Model để không bị râu ông nọ cắm cằm bà kia
                            logger.warn(`[Gateway] Hết Key Google dự phòng. Chuyển Fallback sang mạng Groq...`);
                            targetProvider = 'groq';

                            if (taskName === 'DEEP_ANALYSIS' || taskName === 'MATCH_TIMELINE' || taskName === 'DAILY_BRIEFING' || taskName === 'MONTHLY_REPORT') {
                                targetModel = configModels.LAYER2_MODEL_FALLBACK || 'llama-3.3-70b-versatile';
                                logger.warn(`[Gateway] Đã đổi model sang: ${targetModel}`);
                            } else {
                                targetModel = configModels.LAYER1_MODEL_FALLBACK || 'llama-3.1-8b-instant';
                                logger.warn(`[Gateway] Đã đổi model sang: ${targetModel}`);
                            }
                        }
                    }
                }
                budgetManager.recordUsage({
                    model: targetModel, provider: targetProvider, task: taskName, latency, status: 'FAILED_RETRY'
                });
                
                attempts++;
                if (attempts > maxRetries) {
                    logger.error(`[Gateway] Hết lượt Retry cho Task ${taskName}.`);
                    throw new Error(`Task ${taskName} thất bại sau ${maxRetries} lần thử.`);
                }
                
                await new Promise(res => setTimeout(res, 2000));
            }
        }
    }

    async executeEmbedding(text) {
        const startTime = Date.now();
        const modelName = configModels.EMBEDDING_MODEL_PRIMARY || 'gemini-embedding-1';
        try {
            const vector = await this.providers.google.embedContent(text, modelName);
            budgetManager.recordUsage({
                model: modelName,
                provider: 'google',
                task: 'EMBEDDING',
                promptTokens: Math.round(text.length / 4),
                latency: Date.now() - startTime,
                status: 'SUCCESS'
            });
            return vector;
        } catch (error) {
            const isQuotaOrNetworkError = error.message === "RATE_LIMIT" || 
                                          error.message.includes('429') || 
                                          error.message.includes('503');
                                          
            if (isQuotaOrNetworkError && this.providers.googleBackup) {
                logger.warn(`[Gateway] Embedding Key 1 bị giới hạn. Gánh tải bằng Key Dự phòng...`);
                try {
                    const backupStart = Date.now();
                    const backupVector = await this.providers.googleBackup.embedContent(text, modelName);
                    budgetManager.recordUsage({
                        model: modelName, provider: 'google_backup', task: 'EMBEDDING', latency: Date.now() - backupStart, status: 'SUCCESS'
                    });
                    return backupVector;
                } catch (backupError) {
                    logger.warn(`[Gateway] Key Dự phòng 1 cũng bị giới hạn khi chạy Vector đơn.`);
                    if (this.providers.googleBackup2) {
                        try {
                            const backup2Start = Date.now();
                            const backup2Vector = await this.providers.googleBackup2.embedContent(text, modelName);
                            budgetManager.recordUsage({
                                model: modelName, provider: 'google_backup2', task: 'EMBEDDING', latency: Date.now() - backup2Start, status: 'SUCCESS'
                            });
                            return backup2Vector;
                        } catch (backup2Error) {
                            logger.error(`[Gateway] Cả 3 Key Gemini đều sập khi chạy Vector đơn.`);
                        }
                    } else {
                        logger.error(`[Gateway] Cả 2 Key Gemini đều sập khi chạy Vector đơn.`);
                    }
                }
            } else {
                logger.error(`[Gateway] Embedding thất bại: ${error.message}`);
            }
            budgetManager.recordUsage({
                model: modelName, provider: 'google', task: 'EMBEDDING', latency: Date.now() - startTime, status: 'FAILED'
            });
            throw new Error("Tất cả API Key Embedding đều thất bại.");
        }
    }

    async executeBatchEmbedding(texts) {
        const startTime = Date.now();
        const modelName = configModels.EMBEDDING_MODEL_PRIMARY || 'gemini-embedding-2';
        try {
            const vectors = await this.providers.google.batchEmbedContents(texts, modelName);
            budgetManager.recordUsage({
                model: modelName,
                provider: 'google',
                task: 'BATCH_EMBEDDING',
                promptTokens: Math.round(texts.join(' ').length / 4),
                latency: Date.now() - startTime,
                status: 'SUCCESS'
            });
            return vectors;
        } catch (error) {
            const isQuotaOrNetworkError = error.message === "RATE_LIMIT" || 
                                          error.message.includes('429') || 
                                          error.message.includes('503');
            if (isQuotaOrNetworkError && this.providers.googleBackup) {
                logger.warn(`[Gateway] Batch Embedding Key 1 bị giới hạn. Gánh tải bằng Key Dự phòng...`);
                try {
                    const backupStart = Date.now();
                    const backupVectors = await this.providers.googleBackup.batchEmbedContents(texts, modelName);
                    budgetManager.recordUsage({
                        model: modelName, provider: 'google_backup', task: 'BATCH_EMBEDDING', latency: Date.now() - backupStart, status: 'SUCCESS'
                    });
                    return backupVectors;
                } catch (backupError) {
                    logger.warn(`[Gateway] Batch Embedding Key Dự phòng 1 cũng bị giới hạn.`);
                    if (this.providers.googleBackup2) {
                        try {
                            const backup2Start = Date.now();
                            const backup2Vectors = await this.providers.googleBackup2.batchEmbedContents(texts, modelName);
                            budgetManager.recordUsage({
                                model: modelName, provider: 'google_backup2', task: 'BATCH_EMBEDDING', latency: Date.now() - backup2Start, status: 'SUCCESS'
                            });
                            return backup2Vectors;
                        } catch (backup2Error) {
                            logger.error(`[Gateway] Cả 3 Key Gemini đều sập khi chạy Batch Vector.`);
                        }
                    } else {
                        logger.error(`[Gateway] Cả 2 Key Gemini đều sập khi chạy Batch Vector.`);
                    }
                }
            } else {
                logger.error(`[Gateway] Batch Embedding thất bại: ${error.message}`);
            }
            budgetManager.recordUsage({
                model: modelName, provider: 'google', task: 'BATCH_EMBEDDING', latency: Date.now() - startTime, status: 'FAILED'
            });
            throw new Error("Tất cả API Key Batch Embedding đều thất bại.");
        }
    }
} 

const gateway = new AIGateway();
module.exports = gateway;

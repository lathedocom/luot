const configModels = require('../../config/models');
// Sửa đổi import một chút để lấy được toàn bộ nội dung file tasks.js (chứa system_prompt)
const tasksConfig = require('../../config/tasks'); 
const TASK_ROUTING = tasksConfig.TASK_ROUTING || tasksConfig; 

const GoogleProvider = require('./providers/google');
const GroqProvider = require('./providers/groq');
const { parseAIResponse } = require('./parser');
const logger = require('../utils/logger');
const budgetManager = require('../../budget/budget_manager'); 

class AIGateway {
    constructor() {
        this.providers = {
            google: new GoogleProvider(configModels.API_KEYS.GEMINI),
            googleBackup: configModels.API_KEYS.GEMINI_BACKUP ? new GoogleProvider(configModels.API_KEYS.GEMINI_BACKUP) : null,
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

        // --- 🐛 BẢN VÁ LỖI TẠI ĐÂY ---
        // Nếu hàm gọi bên ngoài không truyền systemInstruction, tự động tìm và kéo system_prompt từ config/tasks.js vào
        let finalSystemInstruction = systemInstruction;
        if (!finalSystemInstruction) {
            const taskDetails = tasksConfig[taskName];
            if (taskDetails && taskDetails.system_prompt) {
                finalSystemInstruction = taskDetails.system_prompt;
            } else if (taskConfig.system_prompt) {
                finalSystemInstruction = taskConfig.system_prompt;
            }
        }
        // ------------------------------

        let attempts = 0;
        const maxRetries = 2; 

        while (attempts <= maxRetries) {
            const startTime = Date.now();
            try {
                const providerInstance = this.providers[targetProvider];
                if (!providerInstance) throw new Error(`Provider ${targetProvider} không tồn tại.`);

                // TRUYỀN finalSystemInstruction ĐÃ ĐƯỢC FIX VÀO ĐÂY
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
                
                // Phân loại lỗi mạng và quota
                const isQuotaOrNetworkError = error.message === "RATE_LIMIT" || 
                                              error.message.includes('429') || 
                                              error.message.includes('404') || 
                                              error.message.includes('503');

                // Ưu tiên 1: Đổi sang Key Google dự phòng
                if (isQuotaOrNetworkError && this.providers.googleBackup && targetProvider === 'google') {
                    logger.warn(`[Gateway] Phát hiện lỗi API Key chính. Đang chuyển sang Key Dự phòng (googleBackup)...`);
                    targetProvider = 'googleBackup';
                } 
                // Ưu tiên 2: Hạ cấp Model hoặc chuyển sang Groq nếu không thể dùng key dự phòng
                else {
                    if (targetModel === configModels.LAYER1_MODEL_PRIMARY) {
                        logger.warn(`[Gateway] Chuyển Fallback sang ${configModels.LAYER1_MODEL_FALLBACK} cho tác vụ nhẹ...`);
                        targetModel = configModels.LAYER1_MODEL_FALLBACK;
                    } else if (targetModel === configModels.LAYER2_MODEL_PRIMARY) {
                        logger.warn(`[Gateway] Chuyển Fallback sang ${configModels.LAYER2_MODEL_FALLBACK} cho tác vụ sâu...`);
                        targetModel = configModels.LAYER2_MODEL_FALLBACK;
                    } else if (this.providers.groq && targetProvider !== 'groq') {
                        logger.warn(`[Gateway] Đổi sang mạng Groq dự phòng...`);
                        targetProvider = 'groq';
                        
                        // ĐÃ SỬA: Lựa chọn tự động model Groq dựa trên model ban đầu
                        if (targetModel.includes('flash-lite') || targetModel.includes('gemma')) {
                            targetModel = configModels.GROQ_MODEL_FAST || 'llama-3.1-8b-instant';
                        } else {
                            targetModel = configModels.GROQ_MODEL_SMART || 'llama-3.3-70b-versatile';
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
            budgetManager.recordUsage({
                model: modelName, provider: 'google', task: 'EMBEDDING', latency: Date.now() - startTime, status: 'FAILED'
            });
            logger.error(`[Gateway] Embedding thất bại: ${error.message}`);
            return new Array(768).fill(0).map(() => Math.random() * 0.01); 
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
            if (error.message.includes('429') && this.providers.googleBackup) {
                logger.warn(`[Gateway] Batch Embedding Key 1 bị giới hạn. Gánh tải bằng Key Dự phòng...`);
                try {
                    const backupStart = Date.now();
                    const backupVectors = await this.providers.googleBackup.batchEmbedContents(texts, modelName);
                    budgetManager.recordUsage({
                        model: modelName, provider: 'google_backup', task: 'BATCH_EMBEDDING', latency: Date.now() - backupStart, status: 'SUCCESS'
                    });
                    return backupVectors;
                } catch (backupError) {
                    logger.error(`[Gateway] Cả 2 Key Gemini đều sập khi chạy Batch Vector.`);
                }
            } else {
                logger.error(`[Gateway] Batch Embedding thất bại: ${error.message}`);
            }
            budgetManager.recordUsage({
                model: modelName, provider: 'google', task: 'BATCH_EMBEDDING', latency: Date.now() - startTime, status: 'FAILED'
            });
            
            return texts.map(() => new Array(768).fill(0).map(() => Math.random() * 0.01));
        }
    }
} 

const gateway = new AIGateway();
module.exports = gateway;

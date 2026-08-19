const configModels = require('../../config/models');
const tasksConfig = require('../../config/tasks');
const TASK_ROUTING = tasksConfig.TASK_ROUTING || tasksConfig;
const GoogleProvider = require('./providers/google');
const GroqProvider = require('./providers/groq');
const { parseAIResponse } = require('./parser');
const logger = require('../utils/logger');
const budgetManager = require('../../budget/budget_manager');

// --- HÀM HELPER: Lấy model Google tiếp theo theo thứ tự ---
function getNextGoogleModel(taskName, currentModel) {
    if (['EXTRACT_METADATA', 'DETECT_ENTITY', 'SHORT_SUMMARY', 'CHECK_NEED_AI'].includes(taskName)) {
        if (currentModel === configModels.LAYER1_MODEL_PRIMARY) return configModels.LAYER1_MODEL_FALLBACK_1;
        return null;
    }
    if (['DEEP_ANALYSIS', 'STORY_MATCHING', 'MATCH_TIMELINE', 'WEEKLY_REPORT'].includes(taskName)) {
        if (currentModel === configModels.LAYER2_MODEL_PRIMARY) return configModels.LAYER2_MODEL_FALLBACK_1;
        return null;
    }
    if (['DAILY_BRIEFING', 'MONTHLY_REPORT'].includes(taskName)) {
        if (currentModel === configModels.LAYER3_MODEL_PREMIUM) return configModels.LAYER3_MODEL_FALLBACK_1;
        if (currentModel === configModels.LAYER3_MODEL_FALLBACK_1) return configModels.LAYER3_MODEL_FALLBACK_2;
        return null;
    }
    return null;
}

// --- HÀM HELPER: Lấy model mạng ngoài (Groq) ---
function getExternalFallback(taskName) {
    if (['DEEP_ANALYSIS', 'STORY_MATCHING', 'MATCH_TIMELINE', 'WEEKLY_REPORT', 'DAILY_BRIEFING', 'MONTHLY_REPORT'].includes(taskName)) {
        return configModels.LAYER3_MODEL_FALLBACK_EXTERNAL || configModels.LAYER2_MODEL_FALLBACK_EXTERNAL || 'openai/gpt-oss-120b';
    }
    return configModels.LAYER1_MODEL_FALLBACK_EXTERNAL || 'openai/gpt-oss-20b';
}

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
        if (!taskConfig) throw new Error(`Task '${taskName}' chưa khai báo.`);
        
        let targetModel = taskConfig.model;
        let targetProvider = taskConfig.provider;

        // --- PRE-CHECK: Trượt mô hình Google xuống cấp thấp hơn nếu hết Quota tính toán ---
        while (targetProvider.startsWith('google') && !budgetManager.canUseModel(targetModel)) {
             let nextModel = getNextGoogleModel(taskName, targetModel);
             if (nextModel) {
                 logger.warn(`[Gateway] Quota cho ${targetModel} sắp hết. Hạ cấp dùng model Google: ${nextModel}`);
                 targetModel = nextModel;
             } else {
                 logger.warn(`[Gateway] Hết sạch Quota mọi model Google cho tác vụ này. Chuyển sang Groq...`);
                 targetProvider = 'groq';
                 targetModel = getExternalFallback(taskName);
                 break;
             }
        }

        let finalSystemInstruction = systemInstruction || taskConfig.system_prompt || (tasksConfig[taskName] ? tasksConfig[taskName].system_prompt : "");
        let attempts = 0;
        const maxRetries = 3; 

        while (attempts <= maxRetries) {
            const startTime = Date.now();
            try {
                const providerInstance = this.providers[targetProvider];
                if (!providerInstance) throw new Error(`Provider ${targetProvider} trống.`);
                
                const resultText = await providerInstance.generateContent(prompt, finalSystemInstruction, targetModel);
                
                budgetManager.recordUsage({
                    model: targetModel, provider: targetProvider, task: taskName,
                    promptTokens: Math.round(prompt.length / 4), completionTokens: Math.round(resultText.length / 4),
                    latency: Date.now() - startTime, status: 'SUCCESS'
                });
                
                return parseAIResponse(resultText);
                
            } catch (error) {
                const latency = Date.now() - startTime;
                logger.warn(`[Gateway] Task ${taskName} (Model: ${targetModel}) bị lỗi: ${error.message}`);
                
                const isQuotaOrNetworkError = error.message === "RATE_LIMIT" || error.message.includes('429') || error.message.includes('404') || error.message.includes('503');
                
                if (isQuotaOrNetworkError) {
                    // Xoay vòng tài nguyên khi gặp lỗi mạng/quota
                    if (targetProvider === 'google' && this.providers.googleBackup) {
                        logger.warn(`[Gateway] Google Key 1 lỗi. Đổi sang Key 2...`);
                        targetProvider = 'googleBackup';
                    } 
                    else if (targetProvider === 'googleBackup' && this.providers.googleBackup2) {
                        logger.warn(`[Gateway] Google Key 2 lỗi. Đổi sang Key 3...`);
                        targetProvider = 'googleBackup2';
                    } 
                    else if (targetProvider.startsWith('google')) {
                        // Vắt kiệt cả 3 Key của Model hiện tại -> Đổi sang Model Google cấp thấp hơn
                        let nextModel = getNextGoogleModel(taskName, targetModel);
                        if (nextModel) {
                            logger.warn(`[Gateway] Hết Key cho ${targetModel}. Hạ cấp dùng model Google: ${nextModel}`);
                            targetModel = nextModel;
                            targetProvider = 'google'; // Quay lại vòng lặp với Key chính, model mới
                        } else {
                            // Cạn kiệt toàn bộ Model & Key của Google -> Cầu dao kích hoạt sang Groq
                            logger.warn(`[Gateway] Cạn kiệt TOÀN BỘ tài nguyên Google. Bật cứu cánh mạng Groq...`);
                            targetProvider = 'groq';
                            targetModel = getExternalFallback(taskName);
                        }
                    }
                }
                
                budgetManager.recordUsage({ model: targetModel, provider: targetProvider, task: taskName, latency, status: 'FAILED_RETRY' });
                
                attempts++;
                if (attempts > maxRetries) throw new Error(`Task ${taskName} thất bại hoàn toàn sau ${maxRetries} lần thử.`);
                await new Promise(res => setTimeout(res, 2000));
            }
        }
    }
    
    // Hàm thực thi Embedding đơn
    async executeEmbedding(text) {
        const startTime = Date.now();
        const modelName = configModels.EMBEDDING_MODEL_PRIMARY || 'gemini-embedding-2';
        try {
            const vector = await this.providers.google.embedContent(text, modelName);
            budgetManager.recordUsage({
                model: modelName, provider: 'google', task: 'EMBEDDING', promptTokens: Math.round(text.length / 4), latency: Date.now() - startTime, status: 'SUCCESS'
            });
            return vector;
        } catch (error) {
            const isQuotaOrNetworkError = error.message === "RATE_LIMIT" || error.message.includes('429') || error.message.includes('503');
            if (isQuotaOrNetworkError && this.providers.googleBackup) {
                logger.warn(`[Gateway] Embedding Key 1 bị giới hạn. Gánh tải bằng Key Dự phòng...`);
                try {
                    const backupStart = Date.now();
                    const backupVector = await this.providers.googleBackup.embedContent(text, modelName);
                    budgetManager.recordUsage({ model: modelName, provider: 'google_backup', task: 'EMBEDDING', latency: Date.now() - backupStart, status: 'SUCCESS' });
                    return backupVector;
                } catch (backupError) {
                    if (this.providers.googleBackup2) {
                        try {
                            const backup2Start = Date.now();
                            const backup2Vector = await this.providers.googleBackup2.embedContent(text, modelName);
                            budgetManager.recordUsage({ model: modelName, provider: 'google_backup2', task: 'EMBEDDING', latency: Date.now() - backup2Start, status: 'SUCCESS' });
                            return backup2Vector;
                        } catch (e) {
                            logger.error(`[Gateway] Cả 3 Key Gemini đều sập khi chạy Vector đơn.`);
                        }
                    } else {
                        logger.error(`[Gateway] Cả 2 Key Gemini đều sập khi chạy Vector đơn.`);
                    }
                }
            }
            budgetManager.recordUsage({ model: modelName, provider: 'google', task: 'EMBEDDING', latency: Date.now() - startTime, status: 'FAILED' });
            throw new Error("Tất cả API Key Embedding đều thất bại.");
        }
    }

    // Hàm thực thi Embedding theo Lô (Batch)
    async executeBatchEmbedding(texts) {
        const startTime = Date.now();
        const modelName = configModels.EMBEDDING_MODEL_PRIMARY || 'gemini-embedding-2';
        try {
            const vectors = await this.providers.google.batchEmbedContents(texts, modelName);
            budgetManager.recordUsage({
                model: modelName, provider: 'google', task: 'BATCH_EMBEDDING', promptTokens: Math.round(texts.join(' ').length / 4), latency: Date.now() - startTime, status: 'SUCCESS'
            });
            return vectors;
        } catch (error) {
            const isQuotaOrNetworkError = error.message === "RATE_LIMIT" || error.message.includes('429') || error.message.includes('503');
            if (isQuotaOrNetworkError && this.providers.googleBackup) {
                logger.warn(`[Gateway] Batch Embedding Key 1 bị giới hạn. Gánh tải bằng Key Dự phòng...`);
                try {
                    const backupStart = Date.now();
                    const backupVectors = await this.providers.googleBackup.batchEmbedContents(texts, modelName);
                    budgetManager.recordUsage({ model: modelName, provider: 'google_backup', task: 'BATCH_EMBEDDING', latency: Date.now() - backupStart, status: 'SUCCESS' });
                    return backupVectors;
                } catch (backupError) {
                    if (this.providers.googleBackup2) {
                        try {
                            const backup2Start = Date.now();
                            const backup2Vectors = await this.providers.googleBackup2.batchEmbedContents(texts, modelName);
                            budgetManager.recordUsage({ model: modelName, provider: 'google_backup2', task: 'BATCH_EMBEDDING', latency: Date.now() - backup2Start, status: 'SUCCESS' });
                            return backup2Vectors;
                        } catch (e) {
                            logger.error(`[Gateway] Cả 3 Key Gemini đều sập khi chạy Batch Vector.`);
                        }
                    } else {
                        logger.error(`[Gateway] Cả 2 Key Gemini đều sập khi chạy Batch Vector.`);
                    }
                }
            }
            budgetManager.recordUsage({ model: modelName, provider: 'google', task: 'BATCH_EMBEDDING', latency: Date.now() - startTime, status: 'FAILED' });
            throw new Error("Tất cả API Key Batch Embedding đều thất bại.");
        }
    }
} 

const gateway = new AIGateway();
module.exports = gateway;

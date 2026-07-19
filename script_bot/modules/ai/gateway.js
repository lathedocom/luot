const configModels = require('../../config/models');
const GoogleProvider = require('./providers/google');
const GroqProvider = require('./providers/groq');
const { parseAIResponse } = require('./parser');
const logger = require('../utils/logger');
const budgetManager = require('../../budget/budget_manager'); 

class AIGateway {
    constructor() {
        this.providers = {
            google: new GoogleProvider(configModels.API_KEYS.GEMINI),
            // Khởi tạo thêm Provider dự phòng nếu đọc được KEY 2 từ môi trường
            googleBackup: process.env.GEMINI_API_KEY_1 ? new GoogleProvider(process.env.GEMINI_API_KEY_1) : null,
            groq: new GroqProvider(configModels.API_KEYS.GROQ)
        };
    }

    async executeGeneration(taskName, prompt, fallbackToGroq = true) {
        logger.info(`[Gateway] Đang xử lý task: ${taskName}...`);
        
        let attempts = 0;
        const maxRetries = 2; 

        while (attempts <= maxRetries) {
            const startTime = Date.now();
            try {
                // Thử gọi Key 1
                const resultText = await this.providers.google.generateContent(prompt);
                
                budgetManager.recordUsage({
                    model: configModels.PRIMARY_MODEL,
                    provider: 'google',
                    task: taskName,
                    promptTokens: Math.round(prompt.length / 4),
                    completionTokens: Math.round(resultText.length / 4),
                    latency: Date.now() - startTime,
                    status: 'SUCCESS'
                });

                return parseAIResponse(resultText);

            } catch (error) {
                const latency = Date.now() - startTime;
                
                // NẾU LỖI 429 -> KÍCH HOẠT KEY DỰ PHÒNG TRƯỚC KHI GỌI GROQ
                if (error.message === "RATE_LIMIT" || error.message.includes('429')) {
                    if (this.providers.googleBackup) {
                        logger.warn(`[Gateway] Key 1 dính Rate Limit (429). Đổi sang Key Dự phòng (KEY 1)...`);
                        try {
                            const backupStart = Date.now();
                            const backupText = await this.providers.googleBackup.generateContent(prompt);
                            
                            budgetManager.recordUsage({
                                model: configModels.PRIMARY_MODEL, provider: 'google_backup', task: taskName, latency: Date.now() - backupStart, status: 'SUCCESS'
                            });
                            return parseAIResponse(backupText);
                        } catch (backupErr) {
                            logger.warn(`[Gateway] Key Dự phòng cũng thất bại. Bắt đầu Fallback sang Groq...`);
                        }
                    } else {
                        logger.warn(`[Gateway] Google dính Rate Limit (429). Bắt đầu Fallback sang Groq...`);
                    }
                    
                    budgetManager.recordUsage({
                        model: configModels.PRIMARY_MODEL, provider: 'google', task: taskName, latency, status: 'HTTP_429'
                    });
                    if (fallbackToGroq) return await this._runFallbackGroq(taskName, prompt);
                }

                // Xử lý các lỗi khác (Mạng, Timeout...) -> Cho phép Retry
                logger.warn(`[Gateway] Google lỗi kết nối: ${error.message}. Thử lại lần ${attempts + 1}/${maxRetries}`);
                budgetManager.recordUsage({
                    model: configModels.PRIMARY_MODEL, provider: 'google', task: taskName, latency, status: 'TIMEOUT_RETRY'
                });
                
                attempts++;
                if (attempts > maxRetries) {
                    logger.error(`[Gateway] Hết lượt Retry. Ép Fallback sang Groq.`);
                    if (fallbackToGroq) return await this._runFallbackGroq(taskName, prompt);
                }
                
                await new Promise(res => setTimeout(res, 2000));
            }
        }
    }

    async _runFallbackGroq(taskName, prompt) {
        const startTime = Date.now();
        try {
            const groqText = await this.providers.groq.generateContent(prompt);
            budgetManager.recordUsage({
                model: 'llama-3.1-8b-instant',
                provider: 'groq',
                task: taskName,
                promptTokens: Math.round(prompt.length / 4),
                completionTokens: Math.round(groqText.length / 4),
                latency: Date.now() - startTime,
                status: 'SUCCESS'
            });
            return parseAIResponse(groqText);
        } catch (groqErr) {
            budgetManager.recordUsage({
                model: 'llama-3.1-8b-instant', provider: 'groq', task: taskName, latency: Date.now() - startTime, status: 'FAILED'
            });
            logger.error(`[Gateway] Groq Fallback cũng thất bại: ${groqErr.message}`);
            throw new Error("All AI Providers failed");
        }
    }

    async executeEmbedding(text) {
        const startTime = Date.now();
        try {
            const vector = await this.providers.google.embedContent(text);
            budgetManager.recordUsage({
                model: configModels.EMBEDDING_MODEL || 'gemini-embedding-2',
                provider: 'google',
                task: 'EMBEDDING',
                promptTokens: Math.round(text.length / 4),
                latency: Date.now() - startTime,
                status: 'SUCCESS'
            });
            return vector;
        } catch (error) {
            budgetManager.recordUsage({
                model: configModels.EMBEDDING_MODEL || 'gemini-embedding-2', provider: 'google', task: 'EMBEDDING', latency: Date.now() - startTime, status: 'FAILED'
            });
            logger.error(`[Gateway] Embedding thất bại: ${error.message}`);
            return new Array(768).fill(0).map(() => Math.random() * 0.01); 
        }
    }

    async executeBatchEmbedding(texts) {
        const startTime = Date.now();
        try {
            const vectors = await this.providers.google.batchEmbedContents(texts);
            
            budgetManager.recordUsage({
                model: configModels.EMBEDDING_MODEL || 'gemini-embedding-2',
                provider: 'google',
                task: 'BATCH_EMBEDDING',
                promptTokens: Math.round(texts.join(' ').length / 4),
                latency: Date.now() - startTime,
                status: 'SUCCESS'
            });
            return vectors;
        } catch (error) {
            // NẾU LÔ BATCH BỊ 429 VÀ CÓ KEY DỰ PHÒNG -> CHUYỂN NGAY LẬP TỨC
            if (error.message.includes('429') && this.providers.googleBackup) {
                logger.warn(`[Gateway] Batch Embedding Key 1 bị giới hạn. Gánh tải bằng Key Dự phòng...`);
                try {
                    const backupStart = Date.now();
                    const backupVectors = await this.providers.googleBackup.batchEmbedContents(texts);
                    
                    budgetManager.recordUsage({
                        model: configModels.EMBEDDING_MODEL || 'gemini-embedding-2', provider: 'google_backup', task: 'BATCH_EMBEDDING', latency: Date.now() - backupStart, status: 'SUCCESS'
                    });
                    return backupVectors;
                } catch (backupError) {
                    logger.error(`[Gateway] Cả 2 Key Gemini đều sập khi chạy Batch Vector.`);
                }
            } else {
                logger.error(`[Gateway] Batch Embedding thất bại: ${error.message}`);
            }

            budgetManager.recordUsage({
                model: configModels.EMBEDDING_MODEL || 'gemini-embedding-2', provider: 'google', task: 'BATCH_EMBEDDING', latency: Date.now() - startTime, status: 'FAILED'
            });
            
            // Trả về mảng vector ảo nếu tất cả phương án đều cạn kiệt
            return texts.map(() => new Array(768).fill(0).map(() => Math.random() * 0.01));
        }
    }
} 

const gateway = new AIGateway();
module.exports = gateway;

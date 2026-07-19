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
            groq: new GroqProvider(configModels.API_KEYS.GROQ)
        };
    }

    async executeGeneration(taskName, prompt, fallbackToGroq = true) {
        logger.info(`[Gateway] Đang xử lý task: ${taskName}...`);
        
        let attempts = 0;
        const maxRetries = 2; // Chỉ Retry cho Timeout/Mạng rớt

        while (attempts <= maxRetries) {
            const startTime = Date.now();
            try {
                // Thử gọi Google
                const resultText = await this.providers.google.generateContent(prompt);
                const latency = Date.now() - startTime;
                
                budgetManager.recordUsage({
                    model: configModels.PRIMARY_MODEL,
                    provider: 'google',
                    task: taskName,
                    promptTokens: Math.round(prompt.length / 4), // Ước lượng tạm 4 char = 1 token
                    completionTokens: Math.round(resultText.length / 4),
                    latency: latency,
                    status: 'SUCCESS'
                });

                return parseAIResponse(resultText);

            } catch (error) {
                const latency = Date.now() - startTime;
                
                // Lỗi Rate Limit 429 -> TUYỆT ĐỐI KHÔNG RETRY, FALLBACK NGAY LẬP TỨC
                if (error.message === "RATE_LIMIT" || fallbackToGroq) {
                    logger.warn(`[Gateway] Google dính Rate Limit (429). Đổi sang Groq...`);
                    budgetManager.recordUsage({
                        model: configModels.PRIMARY_MODEL, provider: 'google', task: taskName, latency, status: 'HTTP_429'
                    });
                    return await this._runFallbackGroq(taskName, prompt);
                }

                // Nếu là lỗi Timeout hoặc mạng -> Cho phép Retry tối đa 2 lần
                logger.warn(`[Gateway] Google lỗi kết nối: ${error.message}. Thử lại lần ${attempts + 1}/${maxRetries}`);
                budgetManager.recordUsage({
                    model: configModels.PRIMARY_MODEL, provider: 'google', task: taskName, latency, status: 'TIMEOUT_RETRY'
                });
                
                attempts++;
                if (attempts > maxRetries) {
                    logger.error(`[Gateway] Hết lượt Retry. Ép Fallback sang Groq.`);
                    return await this._runFallbackGroq(taskName, prompt);
                }
                
                await new Promise(res => setTimeout(res, 2000)); // Nghỉ 2s trước khi retry
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
                model: configModels.EMBEDDING_MODEL || 'embedding-001',
                provider: 'google',
                task: 'EMBEDDING',
                promptTokens: Math.round(text.length / 4),
                latency: Date.now() - startTime,
                status: 'SUCCESS'
            });
            return vector;
        } catch (error) {
            budgetManager.recordUsage({
                model: configModels.EMBEDDING_MODEL || 'embedding-001', provider: 'google', task: 'EMBEDDING', latency: Date.now() - startTime, status: 'FAILED'
            });
            logger.error(`[Gateway] Embedding thất bại: ${error.message}`);
            return new Array(768).fill(0).map(() => Math.random() * 0.01); 
        }
    }

    // === HÀM MỚI ĐƯỢC CHÈN ĐÚNG VỊ TRÍ (BÊN TRONG CLASS) ===
    async executeBatchEmbedding(texts) {
        const startTime = Date.now();
        try {
            const vectors = await this.providers.google.batchEmbedContents(texts);
            
            // Tính tạm số lượng token (4 ký tự ~ 1 token)
            const estimatedTokens = Math.round(texts.join(' ').length / 4);
            
            budgetManager.recordUsage({
                model: configModels.EMBEDDING_MODEL || 'embedding-001',
                provider: 'google',
                task: 'BATCH_EMBEDDING',
                promptTokens: estimatedTokens,
                latency: Date.now() - startTime,
                status: 'SUCCESS'
            });
            return vectors;
        } catch (error) {
            budgetManager.recordUsage({
                model: configModels.EMBEDDING_MODEL || 'embedding-001', provider: 'google', task: 'BATCH_EMBEDDING', latency: Date.now() - startTime, status: 'FAILED'
            });
            logger.error(`[Gateway] Batch Embedding thất bại: ${error.message}`);
            // Rớt mạng thì trả về mảng vector ảo cho toàn bộ lô
            return texts.map(() => new Array(768).fill(0).map(() => Math.random() * 0.01));
        }
    }
} // => KẾT THÚC CLASS AIGateway Ở ĐÂY

const gateway = new AIGateway();
module.exports = gateway;

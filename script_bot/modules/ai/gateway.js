const configModels = require('../../config/models');
const GoogleProvider = require('./providers/google');
const GroqProvider = require('./providers/groq');
const { parseAIResponse } = require('./parser');
const logger = require('../utils/logger');
// [TODO]: Sẽ thay thế quotaManager bằng BudgetManager ở Giai đoạn 4
const quotaManager = require('../quota/quota_manager'); 

class AIGateway {
    constructor() {
        this.providers = {
            google: new GoogleProvider(configModels.API_KEYS.GEMINI),
            groq: new GroqProvider(configModels.API_KEYS.GROQ)
        };
    }

    /**
     * Phương thức thực thi trung tâm cho mọi truy vấn AI (Phân tích, Tóm tắt, v.v.)
     */
    async executeGeneration(taskName, prompt, fallbackToGroq = true) {
        logger.info(`[Gateway] Đang xử lý task: ${taskName}...`);
        
        try {
            // Thử chạy Google trước
            const resultText = await this.providers.google.generateContent(prompt);
            quotaManager.recordUsage(configModels.PRIMARY_MODEL, 1000); 
            
            const parsedJson = parseAIResponse(resultText);
            return parsedJson;

        } catch (error) {
            if (error.message === "RATE_LIMIT" || fallbackToGroq) {
                logger.warn(`[Gateway] Google Provider thất bại (${error.message}). Fallback sang Groq...`);
                try {
                    const groqText = await this.providers.groq.generateContent(prompt);
                    return parseAIResponse(groqText);
                } catch (groqErr) {
                    logger.error(`[Gateway] Groq Fallback cũng thất bại: ${groqErr.message}`);
                    throw new Error("All AI Providers failed");
                }
            }
            throw error;
        }
    }

    /**
     * Phương thức thực thi trung tâm cho Vector Embedding
     */
    async executeEmbedding(text) {
        try {
            const vector = await this.providers.google.embedContent(text);
            quotaManager.recordUsage(configModels.EMBEDDING_MODEL, 500);
            return vector;
        } catch (error) {
            logger.error(`[Gateway] Embedding thất bại: ${error.message}`);
            // Fallback trả về vector ảo để không sập pipeline
            return new Array(768).fill(0).map(() => Math.random() * 0.01); 
        }
    }
}

// Xuất ra một instance duy nhất (Singleton Pattern)
const gateway = new AIGateway();
module.exports = gateway;

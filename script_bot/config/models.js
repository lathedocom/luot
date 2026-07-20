// script_bot/config/models.js
require('dotenv').config();

module.exports = {
    // --- TẦNG 1: Gemma (30 RPM | 16K TPM | 14.4K RPD) ---
    // Gánh 90% khối lượng công việc lặt vặt của hệ thống
    LAYER1_MODEL_PRIMARY: 'gemma-4-31b',
    LAYER1_MODEL_FALLBACK: 'gemma-4-26b',
    
    // --- TẦNG 2: Gemini Workhorse (15 RPM | 250K TPM | 500 RPD) ---
    // Model chủ lực cho phân tích sâu do có Quota RPD khá nhất
    LAYER2_MODEL_PRIMARY: 'gemini-3.1-flash-lite',
    
    // --- TẦNG 3: Gemini Limited (5-10 RPM | 250K TPM | 20 RPD) ---
    // Quota cực thấp, chỉ dùng cho Daily Briefing hoặc Fallback cấp bách
    LAYER3_MODEL_PREMIUM: 'gemini-3-flash',        // 5 RPM / 20 RPD
    LAYER3_MODEL_FALLBACK_1: 'gemini-2.5-flash',   // 5 RPM / 20 RPD
    LAYER3_MODEL_FALLBACK_2: 'gemini-3.5-flash',   // 5 RPM / 20 RPD
    LAYER3_MODEL_LITE_FALLBACK: 'gemini-2.5-flash-lite', // 10 RPM / 20 RPD
    
    // --- TẦNG 0: Embedding (100 RPM | 30K TPM | 1K RPD) ---
    EMBEDDING_MODEL_PRIMARY: 'gemini-embedding-1',
    EMBEDDING_MODEL_FALLBACK: 'gemini-embedding-2',
    
    // API Keys
    API_KEYS: {
        GEMINI: process.env.GEMINI_API_KEY || "",
        GROQ: process.env.GROQ_API_KEY || "" 
    }
};

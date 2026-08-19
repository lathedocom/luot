require('dotenv').config();

module.exports = {
    // --- TẦNG 1: Tác vụ nhẹ, trích xuất dữ liệu ---
    LAYER1_MODEL_PRIMARY: 'gemma-4-26b-it',               // Đã thêm hậu tố -it
    LAYER1_MODEL_FALLBACK_1: 'gemma-4-31b-it',            // Đã thêm hậu tố -it
    LAYER1_MODEL_FALLBACK_EXTERNAL: 'openai/gpt-oss-20b', // Cứu cánh cuối cùng (Groq)
    
    // --- TẦNG 2: Xử lý hàng loạt & Ghép Timeline ---
    LAYER2_MODEL_PRIMARY: 'gemini-3.5-flash-lite',        // Ưu tiên 1 (Google)
    LAYER2_MODEL_FALLBACK_1: 'gemini-3.1-flash-lite',     // Ưu tiên 2 (Google)
    LAYER2_MODEL_FALLBACK_EXTERNAL: 'openai/gpt-oss-120b',// Cứu cánh cuối cùng (Groq)
    
    // --- TẦNG 3: Báo cáo & Phân tích cao cấp ---
    LAYER3_MODEL_PREMIUM: 'gemini-3.7-flash',             // Ưu tiên 1 (Google)
    LAYER3_MODEL_FALLBACK_1: 'gemini-3.6-flash',          // Ưu tiên 2 (Google)
    LAYER3_MODEL_FALLBACK_2: 'gemini-3.5-flash',          // Ưu tiên 3 (Google)
    LAYER3_MODEL_FALLBACK_EXTERNAL: 'openai/gpt-oss-120b',// Cứu cánh cuối cùng (Groq)
    
    // --- TẦNG 0: Embedding ---
    EMBEDDING_MODEL_PRIMARY: 'gemini-embedding-2', 
    EMBEDDING_MODEL_FALLBACK: 'gemini-embedding-2',
    
    // API Keys
    API_KEYS: {
        GEMINI: process.env.GEMINI_API_KEY || "",
        GEMINI_BACKUP: process.env.GEMINI_API_KEY_1 || "",
        GEMINI_BACKUP2: process.env.GEMINI_API_KEY_2 || "", 
        GROQ: process.env.GROQ_API_KEY || "",
        APIFY_API_TOKEN: process.env.APIFY_API_TOKEN || ""
    }
};

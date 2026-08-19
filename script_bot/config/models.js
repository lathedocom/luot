require('dotenv').config();

module.exports = {
    // --- TẦNG 1: Gemma / Llama Fast (Tác vụ nhẹ, cào tin hàng loạt) ---
    LAYER1_MODEL_PRIMARY: 'gemma-4-26b-a4b-it',
    LAYER1_MODEL_FALLBACK: 'openai/gpt-oss-20b', // Thay model 8B cũ
    
    // --- TẦNG 2: Gemini Workhorse (Xử lý hàng loạt & Ghép Timeline) ---
    LAYER2_MODEL_PRIMARY: 'gemini-3.1-flash-lite',
    LAYER2_MODEL_FALLBACK: 'openai/gpt-oss-120b', // Thay model 70B cũ
    
    // --- TẦNG 3: Gemini Limited (Báo cáo & Phân tích cao cấp) ---
    LAYER3_MODEL_PREMIUM: 'gemini-3-flash-preview',
    LAYER3_MODEL_FALLBACK_1: 'gemini-2.5-flash',
    LAYER3_MODEL_FALLBACK_2: 'openai/gpt-oss-120b', // Thay model 70B cũ
    LAYER3_MODEL_LITE_FALLBACK: 'qwen/qwen3.6-27b', 
    
    // --- CẤU HÌNH TRỰC TIẾP MODEL GROQ DỰ PHÒNG ---
    GROQ_MODEL_FAST: 'openai/gpt-oss-20b',        // Thay model 8B cũ
    GROQ_MODEL_SMART: 'openai/gpt-oss-120b',      // Thay model 70B cũ
    GROQ_MODEL_TRANSLATE: 'qwen/qwen3.6-27b',     
    
    // --- TẦNG 0: Embedding (Chuyển đổi Vector) ---
    EMBEDDING_MODEL_PRIMARY: 'gemini-embedding-2', 
    EMBEDDING_MODEL_FALLBACK: 'gemini-embedding-2',
    
    // API Keys
    API_KEYS: {
        GEMINI: process.env.GEMINI_API_KEY || "",
        GEMINI_BACKUP: process.env.GEMINI_API_KEY_1 || "",
        GEMINI_BACKUP2: process.env.GEMINI_API_KEY_2 || "", 
        GROQ: process.env.GROQ_API_KEY || "" ,
        APIFY_API_TOKEN: process.env.APIFY_API_TOKEN || ""
    }
};

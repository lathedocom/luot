require('dotenv').config();

module.exports = {
    // --- TẦNG 1: Gemma / Llama Fast (Tác vụ nhẹ, cào tin hàng loạt) ---
    LAYER1_MODEL_PRIMARY: 'gemma-4-26b-a4b-it',
    LAYER1_MODEL_FALLBACK: 'llama-3.1-8b-instant', // Groq (14.4K RPD)
    
    // --- TẦNG 2: Gemini Workhorse (Xử lý hàng loạt & Ghép Timeline) ---
    LAYER2_MODEL_PRIMARY: 'gemini-3.1-flash-lite',
    LAYER2_MODEL_FALLBACK: 'llama-3.3-70b-versatile', // Groq 70B thông minh hơn
    
    // --- TẦNG 3: Gemini Limited (Báo cáo & Phân tích cao cấp) ---
    LAYER3_MODEL_PREMIUM: 'gemini-3-flash-preview',
    LAYER3_MODEL_FALLBACK_1: 'gemini-2.5-flash',
    LAYER3_MODEL_FALLBACK_2: 'llama-3.3-70b-versatile',
    LAYER3_MODEL_LITE_FALLBACK: 'qwen/qwen3.6-27b', // Groq Qwen xử lý tiếng Việt rất mượt
    
    // --- CẤU HÌNH TRỰC TIẾP MODEL GROQ DỰ PHÒNG ---
    GROQ_MODEL_FAST: 'llama-3.1-8b-instant',      // Tác vụ thô / nhẹ (RPD: 14.4K)
    GROQ_MODEL_SMART: 'llama-3.3-70b-versatile',  // Phân tích sâu / Ghép Timeline (RPD: 1K)
    GROQ_MODEL_TRANSLATE: 'qwen/qwen3.6-27b',     // Dự phòng Tiếng Việt / Dịch thuật (RPD: 1K)
    
    // --- TẦNG 0: Embedding (Chuyển đổi Vector) ---
    EMBEDDING_MODEL_PRIMARY: 'gemini-embedding-2', 
    EMBEDDING_MODEL_FALLBACK: 'gemini-embedding-2',
    
    // API Keys
    API_KEYS: {
        GEMINI: process.env.GEMINI_API_KEY || "",
        GEMINI_BACKUP: process.env.GEMINI_API_KEY_1 || "",
        GROQ: process.env.GROQ_API_KEY || "" 
    }
};

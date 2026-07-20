require('dotenv').config();

module.exports = {
    // --- TẦNG 1: Gemma (Mã nguồn mở) ---
    LAYER1_MODEL_PRIMARY: 'gemma-4-26b-a4b-it', // Cập nhật đúng mã định danh IT
    LAYER1_MODEL_FALLBACK: 'gemma-4-31b-it',
    
    // --- TẦNG 2: Gemini Workhorse (Xử lý hàng loạt) ---
    LAYER2_MODEL_PRIMARY: 'gemini-3.1-flash-lite',
    
    // --- TẦNG 3: Gemini Limited (Tác vụ cao cấp) ---
    LAYER3_MODEL_PREMIUM: 'gemini-3-flash-preview', // Đổi thành bản xem trước
    LAYER3_MODEL_FALLBACK_1: 'gemini-2.5-flash',
    LAYER3_MODEL_FALLBACK_2: 'gemini-3.5-flash',
    LAYER3_MODEL_LITE_FALLBACK: 'gemini-2.5-flash-lite',
    
    // --- TẦNG 0: Embedding (Chuyển đổi Vector) ---
    EMBEDDING_MODEL_PRIMARY: 'text-embedding-004', 
    EMBEDDING_MODEL_FALLBACK: 'embedding-001', // Dùng embedding-001 làm dự phòng siêu an toàn
    
    // API Keys
    API_KEYS: {
        GEMINI: process.env.GEMINI_API_KEY || "",
        GEMINI_BACKUP: process.env.GEMINI_API_KEY_1 || "",
        GROQ: process.env.GROQ_API_KEY || "" 
    }
};

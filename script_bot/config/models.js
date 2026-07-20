// Cấu hình các Model AI và độ ưu tiên (Priority Fallback)
require('dotenv').config();

module.exports = {
    // TẦNG 1 (AI Layer 1): Xử lý metadata, phân loại, entity, short summary
    LAYER1_MODEL_PRIMARY: 'gemma-4-31b',
    LAYER1_MODEL_FALLBACK: 'gemma-4-26b',
    
    // TẦNG 2 & 3 (AI Layer 2 & 3): Phân tích sâu, Daily Briefing, chuỗi hệ quả
    LAYER2_MODEL_PRIMARY: 'gemini-3.1-flash-lite',
    LAYER2_MODEL_FALLBACK: 'gemini-3.5-flash',
    
    // Model chuyên dụng để tạo Vector
    EMBEDDING_MODEL: 'text-embedding-004',
    
    // API Keys lấy từ biến môi trường (Bảo mật)
    API_KEYS: {
        GEMINI: process.env.GEMINI_API_KEY || "",
        GROQ: process.env.GROQ_API_KEY || "" // Dự phòng thêm nếu cần
    }
};

// Cấu hình các Model AI và độ ưu tiên (Priority Fallback)
require('dotenv').config();

module.exports = {
    // Ưu tiên 1: Gemini 3.1 Flash Lite (Rẻ, nhanh, quota cao)
    PRIMARY_MODEL: 'gemini-3.1-flash-lite',
    
    // Ưu tiên 2: Kích hoạt khi model chính bị lỗi hoặc hết Quota
    FALLBACK_MODEL_1: 'gemini-2.5-flash-lite',
    
    // Ưu tiên 3: Model lớn nhất, dùng làm chốt chặn cuối cùng
    FALLBACK_MODEL_2: 'gemini-3.5-flash',
    
    // Model chuyên dụng để tạo Vector
    EMBEDDING_MODEL: 'embedding-001',
    
    // API Keys lấy từ biến môi trường (Bảo mật)
    API_KEYS: {
        GEMINI: process.env.GEMINI_API_KEY || "",
        GROQ: process.env.GROQ_API_KEY || "" // Dự phòng thêm nếu cần
    }
};

// script_bot/config/models.js
require('dotenv').config();

module.exports = {
    // --- TẦNG 1: Gemma (Sửa lại đúng ID của Google API) ---
    // Sử dụng dòng Gemma 2 mới nhất thay vì Gemma 4 (chưa tồn tại)
    LAYER1_MODEL_PRIMARY: 'gemma-2-27b-it', 
    LAYER1_MODEL_FALLBACK: 'gemma-2-9b-it',
    
    // --- TẦNG 2: Gemini Workhorse (15 RPM | 250K TPM | 500 RPD) ---
    LAYER2_MODEL_PRIMARY: 'gemini-3.1-flash-lite',
    
    // --- TẦNG 3: Gemini Limited (5-10 RPM | 250K TPM | 20 RPD) ---
    LAYER3_MODEL_PREMIUM: 'gemini-3-flash',
    LAYER3_MODEL_FALLBACK_1: 'gemini-2.5-flash',
    LAYER3_MODEL_FALLBACK_2: 'gemini-3.5-flash',
    LAYER3_MODEL_LITE_FALLBACK: 'gemini-2.5-flash-lite',
    
    // --- TẦNG 0: Embedding (100 RPM | 30K TPM | 1K RPD) ---
    EMBEDDING_MODEL_PRIMARY: 'gemini-embedding-1',
    EMBEDDING_MODEL_FALLBACK: 'gemini-embedding-2',
    
    // API Keys
    API_KEYS: {
        GEMINI: process.env.GEMINI_API_KEY || "",
        GEMINI_BACKUP: process.env.GEMINI_API_KEY_1 || "",
        GROQ: process.env.GROQ_API_KEY || "" 
    }
};

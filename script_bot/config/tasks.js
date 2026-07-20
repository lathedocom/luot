const models = require('./models');

module.exports = {
    // Bản đồ định tuyến Task -> Model
    TASK_ROUTING: {
        // --- TẦNG 1 (AI LAYER 1) ---
        // Các tác vụ nhỏ gọn, tốn ít context, có thể gọi số lượng lớn (Gemma)
        'EXTRACT_METADATA': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        'DETECT_ENTITY': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        'SHORT_SUMMARY': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        'CHECK_NEED_AI': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        
        // --- TẦNG 2 & 3 (AI LAYER 2 & 3) ---
        // Các tác vụ đòi hỏi suy luận sâu, độ dài lớn, tạo báo cáo (Gemini)
        'DEEP_ANALYSIS': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' },
        'DAILY_BRIEFING': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' },
        'WEEKLY_REPORT': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' },
        'MONTHLY_REPORT': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' }
    }
};

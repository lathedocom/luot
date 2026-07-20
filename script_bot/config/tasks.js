// script_bot/config/tasks.js
const models = require('./models');

module.exports = {
    TASK_ROUTING: {
        // Tầng 1: Dùng Gemma (Free 14.4K/ngày)
        'EXTRACT_METADATA': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        'DETECT_ENTITY': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        'SHORT_SUMMARY': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        'CHECK_NEED_AI': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        
        // Tầng 2: Dùng 3.1 Flash Lite (Free 500/ngày)
        'DEEP_ANALYSIS': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' },
        'WEEKLY_REPORT': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' },
        
        // Tầng 3: Dùng 3 Flash (Free 20/ngày - Giữ gìn cẩn thận)
        'DAILY_BRIEFING': { model: models.LAYER3_MODEL_PREMIUM, provider: 'google' },
        'MONTHLY_REPORT': { model: models.LAYER3_MODEL_PREMIUM, provider: 'google' }
    }
};

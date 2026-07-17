const fs = require('fs');
const path = require('path');
const configModels = require('../../config/models');
const logger = require('../utils/logger');

const STATE_FILE = path.join(__dirname, 'quota_state.json');

/**
 * Đọc file trạng thái, tự động reset về 0 nếu đã qua ngày mới
 */
function readAndResetState() {
    let state = { last_reset: new Date().toISOString().split('T')[0], usage: {} };
    if (fs.existsSync(STATE_FILE)) {
        try {
            state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
        } catch (e) {
            logger.error("Lỗi đọc quota_state.json, dùng mặc định.");
        }
    }

    const today = new Date().toISOString().split('T')[0];
    if (state.last_reset !== today) {
        logger.info("Ngày mới! Reset toàn bộ hệ thống Quota về 0.");
        state.last_reset = today;
        for (let model in state.usage) {
            state.usage[model].rpd = 0;
            state.usage[model].rpm = 0; // Thực tế RPM cần reset mỗi phút, ở mức file ta theo dõi tổng quan
            state.usage[model].tpm = 0;
        }
        writeState(state);
    }
    return state;
}

function writeState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Ghi nhận mỗi lần gọi API thành công để theo dõi sát sao Quota
 */
function recordUsage(modelName, estimatedTokens = 1000) {
    const state = readAndResetState();
    
    if (!state.usage[modelName]) {
        state.usage[modelName] = { rpm: 0, rpd: 0, tpm: 0 };
    }
    
    state.usage[modelName].rpd += 1;
    state.usage[modelName].rpm += 1;
    state.usage[modelName].tpm += estimatedTokens;
    
    writeState(state);
}

/**
 * Cung cấp Model dự phòng nếu Model chính gặp lỗi 429 (Quá tải)
 */
function getFallbackModel(currentModel) {
    if (currentModel === configModels.PRIMARY_MODEL) {
        logger.warn(`Model ${currentModel} quá tải. Chuyển sang ${configModels.FALLBACK_MODEL_1}`);
        return configModels.FALLBACK_MODEL_1;
    }
    if (currentModel === configModels.FALLBACK_MODEL_1) {
        logger.warn(`Model ${currentModel} quá tải. Chuyển sang ${configModels.FALLBACK_MODEL_2}`);
        return configModels.FALLBACK_MODEL_2;
    }
    
    logger.error("Đã hết toàn bộ phương án dự phòng Fallback!");
    return null;
}

module.exports = { 
    recordUsage, 
    getFallbackModel, 
    readState: readAndResetState 
};

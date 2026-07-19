const fs = require('fs');
const path = require('path');
const logger = require('../modules/utils/logger');

const STATE_FILE = path.join(__dirname, 'budget_state.json');
const HISTORY_DIR = path.join(__dirname, 'history');

// Khởi tạo thư mục lịch sử nếu chưa có
if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

function readAndResetState() {
    let state = { last_reset: getTodayString(), usage: {} };
    if (fs.existsSync(STATE_FILE)) {
        try {
            state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
        } catch (e) {
            logger.error("Lỗi đọc budget_state.json, dùng trạng thái mặc định.");
        }
    }

    const today = getTodayString();
    if (state.last_reset !== today) {
        logger.info(`Ngày mới (${today})! Reset toàn bộ Budget State về 0.`);
        state.last_reset = today;
        for (let model in state.usage) {
            state.usage[model].rpd = 0;
            state.usage[model].rpm = 0; 
            state.usage[model].promptTokens = 0;
            state.usage[model].completionTokens = 0;
            state.usage[model].cost = 0;
        }
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    }
    return state;
}

/**
 * Ghi nhận mỗi lần gọi AI và lưu vào lịch sử hàng ngày
 */
function recordUsage({ model, provider, task, promptTokens = 0, completionTokens = 0, latency = 0, status = 'SUCCESS' }) {
    const state = readAndResetState();
    
    if (!state.usage[model]) {
        state.usage[model] = { rpd: 0, rpm: 0, promptTokens: 0, completionTokens: 0, cost: 0, successCount: 0, failCount: 0 };
    }

    // Cập nhật State tức thời
    state.usage[model].rpd += 1;
    state.usage[model].rpm += 1;
    state.usage[model].promptTokens += promptTokens;
    state.usage[model].completionTokens += completionTokens;
    
    if (status === 'SUCCESS') {
        state.usage[model].successCount += 1;
    } else {
        state.usage[model].failCount += 1;
    }

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    // Ghi Log vào History
    const historyFile = path.join(HISTORY_DIR, `${getTodayString()}.json`);
    let history = [];
    if (fs.existsSync(historyFile)) {
        try { history = JSON.parse(fs.readFileSync(historyFile, 'utf-8')); } catch (e) {}
    }

    history.push({
        timestamp: new Date().toISOString(),
        model,
        provider,
        task,
        promptTokens,
        completionTokens,
        latency,
        status
    });

    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

module.exports = { recordUsage, readState: readAndResetState };

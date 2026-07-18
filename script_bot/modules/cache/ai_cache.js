const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const CACHE_FILE = path.join(__dirname, '../../../data/ai_cache.json');

function initCache() {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, JSON.stringify({}));
}

/**
 * Kiểm tra xem Topic này đã được AI phân tích trước đó chưa
 * @param {string} topicKey - Mã chuỗi sự kiện (Ví dụ: evt_123_update_2026)
 */
function getAiResult(topicKey) {
    initCache();
    try {
        const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        return cache[topicKey] || null;
    } catch (e) {
        logger.error("Lỗi đọc file ai_cache.json", e);
        return null;
    }
}

/**
 * Lưu trữ kết quả JSON nguyên bản mà AI vừa trả về
 */
function saveAiResult(topicKey, resultData) {
    initCache();
    try {
        const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        cache[topicKey] = resultData;
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    } catch (e) {
        logger.error("Lỗi ghi file ai_cache.json", e);
    }
}

module.exports = { getAiResult, saveAiResult };

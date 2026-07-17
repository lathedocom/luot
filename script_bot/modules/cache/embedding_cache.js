const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Đặt file cache nằm ở thư mục data ngoài cùng để dễ quản lý
const CACHE_FILE = path.join(__dirname, '../../../../data/embedding_cache.json');

/**
 * Khởi tạo file cache nếu chưa tồn tại
 */
function initCache() {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, JSON.stringify({}));
}

/**
 * Lấy Vector từ bộ nhớ đệm dựa vào mã băm của URL
 * @param {string} urlHash - Mã băm MD5 của URL bài báo
 */
function getEmbedding(urlHash) {
    initCache();
    try {
        const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        return cache[urlHash] || null;
    } catch (e) {
        logger.error("Lỗi đọc file embedding_cache.json", e);
        return null;
    }
}

/**
 * Lưu Vector mới vào bộ nhớ đệm để lần sau không phải gọi API
 */
function saveEmbedding(urlHash, vector) {
    initCache();
    try {
        const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        cache[urlHash] = vector;
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
    } catch (e) {
        logger.error("Lỗi ghi file embedding_cache.json", e);
    }
}

module.exports = { getEmbedding, saveEmbedding };

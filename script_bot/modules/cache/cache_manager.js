const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Tạo mã băm để kiểm tra tính toàn vẹn dữ liệu
function generateChecksum(data) {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

// Đảm bảo file tồn tại trước khi đọc/ghi
function initCacheFile(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}));
}

/**
 * Lấy dữ liệu từ Cache
 * @param {string} cacheName Tên file cache (vd: 'market_cache')
 * @param {string} key Khóa định danh
 */
function getCache(cacheName, key) {
    const filePath = path.join(__dirname, `../../cache/${cacheName}.json`);

    initCacheFile(filePath);
    try {
        const cache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const item = cache[key];
        
        if (!item) return null;
        
        // Kiểm tra Hạn sử dụng (TTL)
        const now = Date.now();
        if (now > item.expires_at) {
            delete cache[key];
            fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
            return null; // Đã hết hạn
        }
        
        return item.data;
    } catch (e) {
        logger.error(`Lỗi đọc cache ${cacheName}`, e);
        return null;
    }
}

/**
 * Ghi dữ liệu vào Cache
 * @param {string} cacheName Tên file cache
 * @param {string} key Khóa định danh
 * @param {any} data Dữ liệu cần lưu
 * @param {number} ttlMinutes Thời gian sống (phút)
 * @param {string} version Phiên bản cấu trúc
 */
function setCache(cacheName, key, data, ttlMinutes = 60, version = '1.0') {
    const filePath = path.join(__dirname, `../../cache/${cacheName}.json`);

    initCacheFile(filePath);
    try {
        const cache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const now = Date.now();
        
        cache[key] = {
            created_at: now,
            expires_at: now + (ttlMinutes * 60 * 1000),
            version: version,
            checksum: generateChecksum(data),
            data: data
        };
        
        fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
    } catch (e) {
        logger.error(`Lỗi ghi cache ${cacheName}`, e);
    }
}

/**
 * Xóa rác: Quét và loại bỏ các item đã hết hạn để chống phình to Repo
 */
function cleanupCache(cacheName) {
    const filePath = path.join(__dirname, `../../cache/${cacheName}.json`);
 
    initCacheFile(filePath);
    try {
        const cache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const now = Date.now();
        let hasChanges = false;
        
        for (const k in cache) {
            if (now > cache[k].expires_at) {
                delete cache[k];
                hasChanges = true;
            }
        }
        
        if (hasChanges) {
            fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
            logger.info(`Đã dọn dẹp rác tự động cho ${cacheName}.json`);
        }
    } catch (e) {
        // Bỏ qua lỗi dọn dẹp phụ
    }
}

module.exports = { getCache, setCache, cleanupCache };

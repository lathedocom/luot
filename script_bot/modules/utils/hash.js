const crypto = require('crypto');

/**
 * Tạo mã băm MD5 từ một chuỗi văn bản.
 * Dùng để băm URL thành một ID ngắn gọn phục vụ cho Cache.
 * @param {string} text - Chuỗi cần băm (Ví dụ: URL bài báo)
 * @returns {string} - Chuỗi băm 32 ký tự (Ví dụ: 'e4d909c290d0fb1ca068ffaddf22cbd0')
 */
function generateHash(text) {
    if (!text) return "";
    return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * Tạo Topic Key ổn định dựa trên một mảng các Entity
 * Băm mảng thành một chuỗi ngắn để gắn đuôi cho event_key
 */
function generateShortHash(text) {
    if (!text) return "";
    // Dùng SHA-256 nhưng cắt lấy 8 ký tự đầu để ID ngắn gọn
    return crypto.createHash('sha256').update(text).digest('hex').substring(0, 8);
}

module.exports = {
    generateHash,
    generateShortHash
};

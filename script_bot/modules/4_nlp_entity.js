const nlp = require('compromise');
const logger = require('./utils/logger');

/**
 * Trích xuất các thực thể (Entity) quan trọng từ nội dung của một cụm sự kiện.
 * Bóc tách: Người, Tổ chức, Địa điểm.
 */
function extractEntities(combinedText) {
    if (!combinedText) return [];

    // Cho thư viện nlp đọc toàn bộ văn bản
    const doc = nlp(combinedText);
    
    // Lấy ra các danh từ riêng (Tên người, tên công ty, tên quốc gia...)
    const people = doc.people().out('array');
    const places = doc.places().out('array');
    const organizations = doc.organizations().out('array');

    // Gom lại, xóa trùng lặp và làm sạch
    const rawEntities = [...people, ...places, ...organizations];
    const uniqueEntities = new Set();

    rawEntities.forEach(entity => {
        const clean = entity.trim().replace(/[^\w\s\u00C0-\u1EF9]/g, ''); // Bỏ dấu câu thừa
        if (clean.length > 2 && clean.length < 30) {
            uniqueEntities.add(clean);
        }
    });

    // Lấy tối đa 10 thực thể cốt lõi nhất để tránh rác
    return Array.from(uniqueEntities).slice(0, 10);
}

module.exports = { extractEntities };

const { generateShortHash } = require('../utils/hash');

function generateEventKey(mainEntities) {
    if (!mainEntities || mainEntities.length === 0) {
        return 'evt_general_' + Date.now();
    }
    
    // [ĐÃ SỬA] Nhận diện thông minh: nếu là object thì lấy e.name, nếu là chuỗi thì giữ nguyên
    const sortedEntities = mainEntities.map(e => {
        const text = typeof e === 'string' ? e : (e.name || '');
        return text.toLowerCase().trim();
    }).filter(Boolean).sort(); // filter(Boolean) để loại bỏ các chuỗi rỗng
    
    const joinedText = sortedEntities.join('_');
    return 'evt_' + generateShortHash(joinedText);
}

// KHÔNG DÙNG AI. Sinh Topic Key dựa trên Hash + Keyword (Từ Similarity Engine) + Năm
function generateTopicKey(eventKey, actionKeyword, year = new Date().getFullYear()) {
    const safeAction = actionKeyword ? actionKeyword.toLowerCase().replace(/\s+/g, '_') : 'update';
    return `${eventKey}_${safeAction}_${year}`;
}

module.exports = {
    generateEventKey,
    generateTopicKey
};

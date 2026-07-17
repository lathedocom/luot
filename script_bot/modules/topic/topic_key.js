const { generateShortHash } = require('../utils/hash');

/**
 * Sinh khóa đại sự kiện (Event Key) cố định theo thời gian.
 * Ví dụ: Apple bị EU phạt. Các thực thể cốt lõi là "Apple", "EU".
 * Cho dù hôm nay là tin "Phạt", ngày mai là tin "Kháng cáo", nó vẫn chung 1 Event Key.
 */
function generateEventKey(mainEntities) {
    if (!mainEntities || mainEntities.length === 0) {
        return 'evt_general_' + Date.now(); // Fallback nếu không có thực thể
    }
    
    // Sắp xếp theo thứ tự chữ cái để đảm bảo [Apple, EU] hay [EU, Apple] đều ra 1 mã giống nhau
    const sortedEntities = mainEntities.map(e => e.toLowerCase().trim()).sort();
    const joinedText = sortedEntities.join('_');
    
    // Tạo mã băm ngắn
    return 'evt_' + generateShortHash(joinedText);
}

/**
 * Sinh khóa chủ đề (Topic Key) cho từng tình tiết nhỏ trong đại sự kiện.
 * Ví dụ: evt_12345_fine_2026 (Tình tiết: Phạt), evt_12345_appeal_2026 (Tình tiết: Kháng cáo)
 */
function generateTopicKey(eventKey, actionKeyword, year = new Date().getFullYear()) {
    const safeAction = actionKeyword ? actionKeyword.toLowerCase().replace(/\s+/g, '_') : 'update';
    return `${eventKey}_${safeAction}_${year}`;
}

module.exports = {
    generateEventKey,
    generateTopicKey
};

const nlp = require('compromise');
const logger = require('./utils/logger');

/**
 * Trích xuất các thực thể (Entity) quan trọng từ nội dung của một cụm sự kiện.
 * Bóc tách: Người, Tổ chức, Địa điểm và gán Type cho từng thực thể.
 */
function extractEntities(combinedText) {
    if (!combinedText) return [];

    // Cho thư viện nlp đọc toàn bộ văn bản
    const doc = nlp(combinedText);
    
    // Lấy ra các danh từ riêng và gán nhãn (type) tương ứng
    const people = doc.people().out('array').map(name => ({ name, type: 'Person' }));
    const places = doc.places().out('array').map(name => ({ name, type: 'Location' }));
    const organizations = doc.organizations().out('array').map(name => ({ name, type: 'Organization' }));

    // Gom tất cả lại thành một mảng object
    const rawEntities = [...people, ...places, ...organizations];
    
    // Dùng Map để khử trùng lặp (Deduplicate) dựa trên tên đã làm sạch
    const uniqueEntitiesMap = new Map();

    rawEntities.forEach(entity => {
        // Làm sạch tên: Bỏ dấu câu thừa, giữ lại chữ cái và khoảng trắng
        const cleanName = entity.name.trim().replace(/[^\w\s\u00C0-\u1EF9]/g, ''); 
        
        // Điều kiện lọc: Tên phải có nghĩa (độ dài từ 3 đến 30 ký tự)
        if (cleanName.length > 2 && cleanName.length < 30) {
            // Nếu chưa có trong Map, hoặc muốn ưu tiên type chính xác hơn thì lưu vào
            if (!uniqueEntitiesMap.has(cleanName)) {
                uniqueEntitiesMap.set(cleanName, {
                    name: cleanName,
                    type: entity.type
                });
            }
        }
    });

    // Trả về tối đa 10 thực thể cốt lõi nhất (dạng mảng object)
    return Array.from(uniqueEntitiesMap.values()).slice(0, 10);
}

module.exports = { extractEntities };

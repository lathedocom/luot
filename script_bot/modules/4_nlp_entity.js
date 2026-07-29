const nlp = require('compromise');
const logger = require('./utils/logger');

// [MỚI] 1. Danh sách các Danh từ chung / Chức danh cấm đưa lên bản đồ
const BLACKLIST = [
    'president', 'minister', 'ceo', 'director', 'secretary', 'spokesperson', 'leader', 'official',
    'tổng thống', 'bộ trưởng', 'thủ tướng', 'chủ tịch', 'giám đốc', 'đại sứ', 'lãnh đạo', 'người phát ngôn',
    'chính phủ', 'government', 'state', 'nhà nước', 'quốc gia', 'bộ ngoại giao', 'quốc hội', 'parliament'
];

/**
 * [MỚI] 2. Hàm kiểm tra: Có phải là Danh từ riêng (Viết hoa chữ cái đầu) không?
 */
function isProperNoun(str) {
    if (!str) return false;
    // Kiểm tra ký tự đầu tiên có viết hoa không (hỗ trợ cả tiếng Việt có dấu)
    return /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ]/.test(str);
}

function extractEntities(combinedText) {
    if (!combinedText) return [];
    
    // Cho thư viện NLP đọc văn bản
    const doc = nlp(combinedText);
    
    const people = doc.people().out('array').map(name => ({ name, type: 'Person' }));
    const places = doc.places().out('array').map(name => ({ name, type: 'Location' }));
    const organizations = doc.organizations().out('array').map(name => ({ name, type: 'Organization' }));
    
    const rawEntities = [...people, ...places, ...organizations];
    const uniqueEntitiesMap = new Map();
    
    rawEntities.forEach(entity => {
        // Làm sạch ký tự đặc biệt
        let cleanName = entity.name.trim().replace(/[^\w\s\u00C0-\u1EF9]/g, ''); 
        
        // [MỚI] 3. Cắt bỏ các chức danh ở đầu tên để gom Node chuẩn hơn
        // Ví dụ: "President Zelensky" sẽ bị cắt chữ President, chỉ còn "Zelensky"
        const titleRegex = /^(president|tổng thống|bộ trưởng|thủ tướng|chủ tịch|minister|ceo|mr|mrs|ms)\s+/i;
        cleanName = cleanName.replace(titleRegex, '').trim();

        const nameLower = cleanName.toLowerCase();

        // 4. BỘ LỌC ĐA TẦNG
        if (
            cleanName.length > 2 && 
            cleanName.length < 30 && 
            isProperNoun(cleanName) && // Phải viết hoa chữ đầu
            !BLACKLIST.includes(nameLower) // Không được nằm trong danh sách đen
        ) {
            if (!uniqueEntitiesMap.has(cleanName)) {
                uniqueEntitiesMap.set(cleanName, {
                    name: cleanName,
                    type: entity.type
                });
            }
        }
    });
    
    return Array.from(uniqueEntitiesMap.values()).slice(0, 10);
}

module.exports = { extractEntities };

// FILE: script_bot/modules/4_nlp_entity.js
const nlp = require('compromise');
const logger = require('./utils/logger');

// 1. Danh sách Đen (Từ phổ thông, chức danh, sai nghĩa)
const BLACKLIST = [
    'president', 'minister', 'ceo', 'director', 'secretary', 'spokesperson', 'leader', 'official',
    'tổng thống', 'bộ trưởng', 'thủ tướng', 'chủ tịch', 'giám đốc', 'đại sứ', 'lãnh đạo', 'người phát ngôn',
    'chính phủ', 'government', 'state', 'nhà nước', 'quốc gia', 'bộ ngoại giao', 'quốc hội', 'parliament',
    'đại biểu', 'cơ sở', 'dữ liệu', 'giá đất', 'giao dịch', 'thực tế', 'thủ tục', 'chi phí', 'đầu vào',
    'người dân', 'dân', 'mỹ dân', 'nhân dân', 'công dân', 'quốc dân', 'thị trường', 'kinh tế', 'đầu tư',
    'theo', 'việc', 'có', 'thể', 'ngày', 'tháng', 'năm', 'hôm nay', 'chiều nay', 'sáng nay', 'qua', 'nay'
];

// 2. Các từ ngữ hay dính vào đầu thực thể (Tiếng Việt)
const PREFIXES_REGEX = /^(Theo|Tại|Ở|Về|Việc|Các|Những|Một|Hai|Ba|Ông|Bà|Anh|Chị|Thủ tướng|Tổng thống|Bộ trưởng|Đại biểu|Chủ tịch|Giám đốc|Đại sứ|Người phát ngôn|Phó|Trưởng|Mr|Mrs|Ms)\s+/i;

function isProperNoun(str) {
    if (!str) return false;
    // Bắt buộc chữ cái đầu tiên phải viết hoa
    return /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ]/.test(str);
}

function extractEntities(combinedText) {
    if (!combinedText) return [];

    // 1. Tách các cụm bị dính bởi dấu gạch ngang (Ví dụ: Mỹ - Hàn -> Mỹ, Hàn)
    let textToProcess = combinedText.replace(/\s*-\s*/g, ', ');

    // 2. Dùng Compromise quét sơ bộ (giữ lại để bắt tên tiếng Anh chuẩn)
    const doc = nlp(textToProcess);
    const people = doc.people().out('array').map(name => ({ name, type: 'Person' }));
    const places = doc.places().out('array').map(name => ({ name, type: 'Location' }));
    const orgs = doc.organizations().out('array').map(name => ({ name, type: 'Organization' }));

    // 3. Dùng Regex chuyên dụng bắt Danh từ riêng Tiếng Việt (chữ cái đầu viết hoa liên tiếp)
    const vnRegex = /([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ][a-zàáâãèéêìíòóôõùúăđĩũơưăạảấầẩẫậắằẳẵặẹẻẽềềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]*(\s+[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ][a-zàáâãèéêìíòóôõùúăđĩũơưăạảấầẩẫậắằẳẵặẹẻẽềềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]*)*)/g;
    const vnMatches = textToProcess.match(vnRegex) || [];
    const vnEntities = vnMatches.map(name => ({ name: name, type: 'Unknown' }));

    const rawEntities = [...people, ...places, ...orgs, ...vnEntities];
    const uniqueEntitiesMap = new Map();

    rawEntities.forEach(entity => {
        // a) Cắt bỏ dấu câu thừa ở hai đầu
        let cleanName = entity.name.replace(/^[^a-zA-ZÀ-ỹ0-9]+|[^a-zA-ZÀ-ỹ0-9]+$/g, '').trim();
        
        // b) Khử tiền tố chức danh (lặp lại 2 lần để bắt các cụm như "Theo Thủ tướng")
        cleanName = cleanName.replace(PREFIXES_REGEX, '').trim();
        cleanName = cleanName.replace(PREFIXES_REGEX, '').trim(); 

        // c) Cắt đuôi rác do NLP kéo nhầm (có, thể, đã, đang, nhằm, giúp...)
        cleanName = cleanName.replace(/\s+(có|thể|đã|đang|sẽ|là|thì|mà|của|và|với|nhằm|giúp)$/i, '').trim();

        const nameLower = cleanName.toLowerCase();

        // d) Kiểm tra tính hợp lệ
        if (
            cleanName.length >= 2 && 
            cleanName.length <= 30 && 
            isProperNoun(cleanName) && 
            !BLACKLIST.includes(nameLower) &&
            !nameLower.includes('dân') && // Lọc cụm từ chứa 'dân' (Mỹ dân)
            !nameLower.includes('thủ') && // Lọc "Theo thủ"
            !nameLower.includes('đại biểu')
        ) {
            // Ưu tiên type cụ thể
            if (!uniqueEntitiesMap.has(cleanName) || uniqueEntitiesMap.get(cleanName).type === 'Unknown') {
                uniqueEntitiesMap.set(cleanName, {
                    name: cleanName,
                    type: entity.type !== 'Unknown' ? entity.type : (uniqueEntitiesMap.get(cleanName)?.type || 'Unknown')
                });
            }
        }
    });

    return Array.from(uniqueEntitiesMap.values()).slice(0, 10);
}

module.exports = { extractEntities };

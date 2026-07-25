// FILE: script_bot/modules/rule_engine/region.js
const { REGIONS, SOURCE_DEFAULT_REGION } = require('../../config/regions');

/**
 * Xác định khu vực địa lý của bài báo bằng thuật toán Chấm điểm (Scoring).
 * Thay vì gán nhãn cứng, hệ thống sẽ đếm số lần xuất hiện của từ khóa.
 * Khu vực nào được nhắc đến nhiều nhất sẽ vươn lên dẫn đầu.
 */
function extractRegions(text, sourceName) {
    // 1. Trường hợp ngoại lệ: Text rỗng
    if (!text) {
        return SOURCE_DEFAULT_REGION[sourceName] ? [SOURCE_DEFAULT_REGION[sourceName]] : ['global'];
    }

    const scores = {};
    
    // 2. Chấm điểm dựa trên tần suất xuất hiện của từ khóa
    for (const reg of REGIONS) {
        scores[reg.id] = 0;
        for (const kw of reg.keywords) {
            // Dùng Regex tìm CHÍNH XÁC từ khóa. 
            // \p{L} giúp nhận diện chữ cái có dấu Tiếng Việt (tránh lỗi 'anh' lọt vào 'nhanh')
            const regex = new RegExp(`(^|[^\\p{L}])${kw}([^\\p{L}]|$)`, 'giu');
            const matches = text.match(regex);
            
            if (matches) {
                scores[reg.id] += matches.length; // Cộng điểm bằng số lần lặp lại
            }
        }
    }

    // 3. Lọc ra các khu vực có điểm > 0 và sắp xếp từ cao xuống thấp
    const matchedRegions = Object.keys(scores)
        .filter(id => scores[id] > 0)
        .sort((a, b) => scores[b] - scores[a]); 

    // 4. Quyết định kết quả trả về
    if (matchedRegions.length > 0) {
        // Trả về mảng các khu vực được nhắc đến (Thằng điểm cao nhất nằm ở index 0)
        return matchedRegions; 
    }

    // 5. NẾU MÙ TỪ KHÓA: Kích hoạt cơ chế Fallback (Dự phòng) lấy theo Nguồn báo
    if (sourceName && SOURCE_DEFAULT_REGION[sourceName]) {
        return [SOURCE_DEFAULT_REGION[sourceName]];
    }

    // 6. Cuối cùng, nếu hoàn toàn không có manh mối, gán nhãn Toàn cầu
    return ['global'];
}

module.exports = { extractRegions };

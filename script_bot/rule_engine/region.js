const { REGIONS, SOURCE_DEFAULT_REGION } = require('../../config/regions');

/**
 * Xác định khu vực địa lý của bài báo (Việt Nam, Mỹ, Global...).
 * Ưu tiên 1: Dựa vào tên báo (VD: VNExpress mặc định là Việt Nam).
 * Ưu tiên 2: Dò từ khóa trong văn bản.
 */
function extractRegions(text, sourceName) {
    const matched = new Set(); // Dùng Set để tránh trùng lặp
    
    // 1. Ưu tiên map cứng theo nguồn báo
    if (sourceName && SOURCE_DEFAULT_REGION[sourceName]) {
        matched.add(SOURCE_DEFAULT_REGION[sourceName]);
    }

    // 2. Dò theo keyword trong nội dung
    if (text) {
        const lowerText = text.toLowerCase();
        for (const reg of REGIONS) {
            for (const kw of reg.keywords) {
                if (lowerText.includes(kw.toLowerCase())) {
                    matched.add(reg.id);
                    break;
                }
            }
        }
    }

    const resultArray = Array.from(matched);
    // Nếu không dò được gì, mặc định là 'global'
    return resultArray.length > 0 ? resultArray : ['global'];
}

module.exports = { extractRegions };

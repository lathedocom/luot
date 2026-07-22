/**
 * Thuật toán tính điểm Importance (Độ quan trọng) từ 0 đến 100.
 * Ưu tiên chấm điểm dựa trên độ khớp với 11 lĩnh vực quan tâm.
 */
function calculateImportance(categories, regions, sourcesCount, isHot = false) {
    let score = 30; // Điểm nền cơ bản cho mọi bản tin

    // 1. Chấm điểm theo lĩnh vực ưu tiên
    const PRIORITY_FIELDS = [
        'money', 'economy', 'finance', 'trade', 'investment', 
        'tech', 'science', 'politics', 'policy', 'law', 'military'
    ];
    
    if (categories && categories.length > 0) {
        const matchedPriority = categories.filter(c => PRIORITY_FIELDS.includes(c));
        if (matchedPriority.length > 0) {
            // Tin càng liên quan nhiều lĩnh vực quan tâm thì điểm càng cao (tối đa +40 điểm)
            score += Math.min(matchedPriority.length * 10, 40);
        }
    }

    // 2. Phủ nhiều khu vực
    if (regions && regions.includes('global')) {
        score += 15; 
    } else if (regions && regions.length > 1) {
        score += (regions.length * 5);
    }

    // 3. Số lượng báo cùng đưa tin (Giảm trọng số)
    if (sourcesCount && sourcesCount > 1) {
        // Mỗi bài báo chỉ cộng 2 điểm, tối đa 10 điểm (thay vì 30 điểm)
        score += Math.min(sourcesCount * 2, 10); 
    }

    // 4. Có gắn mác Sự kiện Nóng
    if (isHot) {
        score += 10;
    }

    return Math.min(Math.max(score, 0), 100);
}

module.exports = { calculateImportance };

// --- File: script_bot/modules/scoring/importance.js ---

function calculateImportance(categories, regions) {
    let score = 0;

    // Đưa tất cả 11 lĩnh vực quan tâm vào chung 1 nhóm ưu tiên
    const PRIORITY_CATEGORIES = ['money','economy','finance','trade','investment','tech','science','politics','policy','law','military'];
    
    categories.forEach(cat => {
        if (PRIORITY_CATEGORIES.includes(cat)) {
            score += 60; 
        } else {
            score += 10;
        }
    });

    // SỬA LỖI: Sử dụng chuẩn ID viết thường để khớp với config/regions.js
    if (regions && (regions.includes('global') || regions.includes('usa') || regions.includes('china') || regions.includes('vietnam'))) {
    score += 15;
}

    return Math.min(score, 100);
}

module.exports = { calculateImportance };

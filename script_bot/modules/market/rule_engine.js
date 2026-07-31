const knowledgeBase = require('../../config/market_knowledge.json');

function calculateCategoryScore(categoryName, historyDb) {
    const indicators = knowledgeBase.health_categories[categoryName];
    let score = 50; // Điểm nền trung tính

    // Thuật toán ví dụ: Đánh giá mảng Chi phí sinh hoạt (Cost of Living)
    if (categoryName === 'cost_of_living') {
        const cpiData = historyDb['CPI_VN'] || [];
        const gasData = historyDb['RON95'] || [];
        
        if (cpiData.length >= 2) {
            const currentCPI = cpiData[cpiData.length - 1].value;
            const prevCPI = cpiData[cpiData.length - 2].value;
            if (currentCPI > prevCPI) score -= 10; // Lạm phát tăng -> Xấu -> Trừ điểm
            if (currentCPI < prevCPI) score += 10; // Lạm phát giảm -> Tốt -> Cộng điểm
        }
        
        if (gasData.length >= 2) {
            if (gasData[gasData.length - 1].value > gasData[gasData.length - 2].value) score -= 5;
        }
    }
    
    // Trả về Trạng thái cứng
    let status = "Ổn định";
    if (score >= 70) status = "Tích cực";
    if (score <= 30) status = "Căng thẳng";
    if (score > 30 && score < 50) status = "Cần theo dõi";

    return { score, status };
}

module.exports = { calculateCategoryScore };

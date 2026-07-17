const logger = require('../utils/logger');

/**
 * Sinh bản tin Monthly Briefing.
 * Chỉ chạy vào ngày cuối cùng của tháng.
 */
async function generateMonthlyBriefing(allTopics) {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const topTopics = allTopics.filter(t => t.timestamp >= thirtyDaysAgo && (t.importance || 0) >= 70);

    const prompt = `Tổng hợp vĩ mô tháng qua dựa trên các sự kiện: ${JSON.stringify(topTopics.map(t=>t.title))}`;
    
    // [TODO]: Gọi API tới Gemini
    return `<h3>Tổng kết Tháng</h3><p>Dữ liệu tháng đang được tổng hợp...</p>`;
}

module.exports = { generateMonthlyBriefing };

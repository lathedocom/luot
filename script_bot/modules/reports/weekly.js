const logger = require('../utils/logger');

/**
 * Xử lý sinh bản tin Weekly Briefing.
 * Lọc sự kiện trong 7 ngày, loại bỏ tin rác, chỉ tập trung vào tin có Importance cao.
 */
async function generateWeeklyBriefing(allTopics) {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Lọc tin 7 ngày và có điểm quan trọng (importance) trên 50
    const topTopics = allTopics.filter(t => t.timestamp >= sevenDaysAgo && (t.importance || 0) >= 50);

    if (topTopics.length === 0) return "<p>Tuần qua không có sự kiện vĩ mô nào đáng chú ý.</p>";

    const outline = topTopics.map(t => `- ${t.title}`).join('\n');

    const prompt = `
Bạn là Chuyên gia Phân tích Vĩ mô. Dựa vào danh sách các sự kiện quan trọng trong tuần qua:
${outline}

Hãy viết bản tin "Weekly Briefing". Bỏ qua tiểu tiết, chỉ tập trung phân tích xu hướng (Trend) của tuần qua và dự báo tuần tới.
Định dạng đầu ra bằng HTML cơ bản.
`;

    // [TODO]: Gọi API tới Gemini
    return `<h3>Tiêu điểm Tuần qua</h3><p>Bản tin tuần đang được cấu hình...</p>`;
}

module.exports = { generateWeeklyBriefing };

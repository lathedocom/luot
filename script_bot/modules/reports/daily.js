const logger = require('../utils/logger');

/**
 * Xử lý sinh bản tin Daily Briefing.
 * Lọc các sự kiện trong 24h qua và tạo Prompt kể chuyện.
 */
async function generateDailyBriefing(allTopics) {
    // 1. Lọc các sự kiện mới cập nhật trong vòng 24h
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentTopics = allTopics.filter(t => t.timestamp >= oneDayAgo);

    if (recentTopics.length === 0) {
        logger.warn("Không có sự kiện mới trong 24h qua để làm Briefing.");
        return "<p>Hôm nay không có sự kiện nào nổi bật.</p>";
    }

    // 2. Trích xuất dàn ý cho AI (chỉ lấy tiêu đề và tóm tắt để tiết kiệm Token)
    const outline = recentTopics.map(t => `- ${t.title}: ${t.short_summary}`).join('\n');

    const prompt = `
Bạn là Tổng biên tập của một nền tảng tình báo. Dựa vào danh sách sự kiện 24h qua dưới đây:
${outline}

Hãy viết một bản tin "Daily Briefing" (khoảng 600 từ) theo phong cách kể chuyện logic.
Đừng chỉ liệt kê. Hãy móc nối các sự kiện lại với nhau (Ví dụ: Tin Mỹ ảnh hưởng ra sao, sau đó đến tin Việt Nam).
Định dạng đầu ra: Sử dụng thẻ HTML cơ bản (<h3>, <p>, <ul>, <li>, <strong>) để Frontend hiển thị đẹp mắt.
Không dùng Markdown code block (\`\`\`html).
`;

    // [TODO]: Gọi API tới Gemini 3.5 Flash (Model thông minh nhất để viết văn)
    // const aiResponse = await callAI(prompt);
    
    // Tạm thời trả về văn bản mô phỏng để Frontend có dữ liệu render
    return `<h3>Bức tranh Toàn cảnh 24h</h3><p>Hệ thống AI đang được nâng cấp, bản tin thực tế sẽ xuất hiện tại đây sau khi kết nối API.</p>`;
}

module.exports = { generateDailyBriefing };

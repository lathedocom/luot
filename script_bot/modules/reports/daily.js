const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const PROMPT_DAILY = fs.readFileSync(path.join(__dirname, '../../../prompts/reports/daily_report.md'), 'utf8');

async function generateDailyBriefing(allTopics) {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentTopics = allTopics.filter(t => t.timestamp >= oneDayAgo);
    if (recentTopics.length === 0) {
        logger.warn("Không có sự kiện mới trong 24h qua để làm Briefing.");
        return "<p>Hôm nay không có sự kiện nào nổi bật.</p>";
    }

    const outline = recentTopics.map(t => `- ${t.title}: ${t.short_summary}`).join('\n');
    
    // Nạp Outline vào file Prompt tĩnh
    const prompt = PROMPT_DAILY.replace('{{OUTLINE}}', outline);
    
    // [TODO]: Giai đoạn 3 (AI Gateway) sẽ đảm nhiệm việc gọi API bằng biến "prompt" này.
    
    return `<h3>Bức tranh Toàn cảnh 24h</h3><p>Hệ thống AI đang được nâng cấp, bản tin thực tế sẽ xuất hiện tại đây sau khi hoàn tất Giai đoạn 3 (AI Gateway).</p>`;
}

module.exports = { generateDailyBriefing };

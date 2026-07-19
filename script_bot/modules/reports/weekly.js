const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const PROMPT_WEEKLY = fs.readFileSync(path.join(__dirname, '../../../prompts/reports/weekly_report.md'), 'utf8');

async function generateWeeklyBriefing(allTopics) {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const topTopics = allTopics.filter(t => t.timestamp >= sevenDaysAgo && (t.importance || 0) >= 50);
    
    if (topTopics.length === 0) return "<p>Tuần qua không có sự kiện vĩ mô nào đáng chú ý.</p>";
    
    const outline = topTopics.map(t => `- ${t.title}`).join('\n');
    
    // Nạp Outline vào file Prompt tĩnh
    const prompt = PROMPT_WEEKLY.replace('{{OUTLINE}}', outline);
    
    // [TODO]: Chờ kết nối AI Gateway ở Giai đoạn 3
    return `<h3>Tiêu điểm Tuần qua</h3><p>Bản tin tuần đang được cấu hình...</p>`;
}

module.exports = { generateWeeklyBriefing };

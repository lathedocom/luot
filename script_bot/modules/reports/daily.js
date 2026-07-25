const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const gateway = require('../ai/gateway');

const PROMPT_DAILY = fs.readFileSync(path.join(__dirname, '../../prompts/reports/daily_report.md'), 'utf8');

/**
 * Hàm phân loại sự kiện vào các nhóm khu vực ưu tiên
 */
function groupTopicsByRegion(topics) {
    const groups = {
        vietnam: [],
        asean: [],
        asia: [],
        global: []
    };

    topics.forEach(topic => {
        const regions = topic.regions || [];
        if (regions.includes('vietnam')) {
            groups.vietnam.push(topic);
        } else if (regions.includes('asean')) {
            groups.asean.push(topic);
        } else if (regions.includes('asia') || regions.includes('china') || regions.includes('japan') || regions.includes('korea') || regions.includes('india')) {
            groups.asia.push(topic);
        } else {
            groups.global.push(topic);
        }
    });

    return groups;
}

async function generateDailyBriefing(allTopics) {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    // Lọc tin 24h qua và ưu tiên tin có giá trị/độ quan trọng cao
    const recentTopics = allTopics
        .filter(t => (t.timestamp || t.last_updated) >= oneDayAgo)
        .sort((a, b) => (b.value_score || 0) - (a.value_score || 0));

    if (recentTopics.length === 0) {
        logger.warn("Không có sự kiện mới trong 24h qua để làm Briefing.");
        return "<p>Hôm nay hệ thống chưa ghi nhận sự kiện biến động lớn nào.</p>";
    }

    // 1. Phân nhóm theo khu vực
    const grouped = groupTopicsByRegion(recentTopics);

    // 2. Dựng Outline theo chuẩn Việt Nam -> ASEAN -> Châu Á -> Thế giới
    let outlineStr = "";
    
    if (grouped.vietnam.length > 0) {
        outlineStr += "=== KHU VỰC VIỆT NAM ===\n";
        grouped.vietnam.forEach(t => outlineStr += `- ${t.title}: ${t.short_summary}\n`);
    }
    if (grouped.asean.length > 0) {
        outlineStr += "\n=== KHU VỰC ĐÔNG NAM Á (ASEAN) ===\n";
        grouped.asean.forEach(t => outlineStr += `- ${t.title}: ${t.short_summary}\n`);
    }
    if (grouped.asia.length > 0) {
        outlineStr += "\n=== KHU VỰC CHÂU Á ===\n";
        grouped.asia.forEach(t => outlineStr += `- ${t.title}: ${t.short_summary}\n`);
    }
    if (grouped.global.length > 0) {
        outlineStr += "\n=== KHU VỰC THẾ GIỚI / TOÀN CẦU ===\n";
        grouped.global.forEach(t => outlineStr += `- ${t.title}: ${t.short_summary}\n`);
    }

    // 3. Ghép vào Prompt template
    const prompt = PROMPT_DAILY.replace('{{OUTLINE}}', outlineStr);

    try {
        logger.info("[Daily Briefing] Đang gọi AI tổng hợp bản tin 24h...");
        // Gọi AI qua Gateway (Sử dụng Task DAILY_BRIEFING đã cấu hình)
        const response = await gateway.executeTask('DAILY_BRIEFING', prompt);
        
        // Nếu response dạng JSON/Object thì lấy trường content/summary, nếu là chuỗi HTML thì dùng trực tiếp
        if (typeof response === 'object' && response !== null) {
            return response.content || response.summary || response.text || JSON.stringify(response);
        }
        return response;
    } catch (error) {
        logger.error("[Daily Briefing] Lỗi khi tạo bản tin 24h:", error);
        return `<p>Không thể khởi tạo bản tin 24h tự động do lỗi kết nối AI. Vui lòng thử lại sau.</p>`;
    }
}

module.exports = { generateDailyBriefing };

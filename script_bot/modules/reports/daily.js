const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const gateway = require('../ai/gateway');

const PROMPT_DAILY = fs.readFileSync(path.join(__dirname, '../../prompts/reports/daily_report.md'), 'utf8');

function groupTopicsByRegion(topics) {
    const groups = { vietnam: [], asean: [], asia: [], global: [] };

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
    const recentTopics = allTopics
        .filter(t => (t.timestamp || t.last_updated) >= oneDayAgo)
        .sort((a, b) => (b.value_score || 0) - (a.value_score || 0));

    if (recentTopics.length === 0) {
        logger.warn("Không có sự kiện mới trong 24h qua để làm Briefing.");
        return "<p style='opacity: 0.7;'>Hôm nay hệ thống chưa ghi nhận sự kiện biến động lớn nào.</p>";
    }

    const grouped = groupTopicsByRegion(recentTopics);

    // Dựng Outline
    let outlineStr = "";
    if (grouped.vietnam.length > 0) { outlineStr += "=== KHU VỰC VIỆT NAM ===\n"; grouped.vietnam.forEach(t => outlineStr += `- ${t.title}: ${t.short_summary}\n`); }
    if (grouped.asean.length > 0) { outlineStr += "\n=== KHU VỰC ĐÔNG NAM Á (ASEAN) ===\n"; grouped.asean.forEach(t => outlineStr += `- ${t.title}: ${t.short_summary}\n`); }
    if (grouped.asia.length > 0) { outlineStr += "\n=== KHU VỰC CHÂU Á ===\n"; grouped.asia.forEach(t => outlineStr += `- ${t.title}: ${t.short_summary}\n`); }
    if (grouped.global.length > 0) { outlineStr += "\n=== KHU VỰC THẾ GIỚI ===\n"; grouped.global.forEach(t => outlineStr += `- ${t.title}: ${t.short_summary}\n`); }

    // Lấy ngày hiện tại để chống hiện tượng AI "ảo giác" thời gian
    const todayStr = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    // Nhúng Dữ liệu & Ngày giờ vào Prompt
    const prompt = PROMPT_DAILY.replace('{{OUTLINE}}', outlineStr).replace('{{DATE}}', todayStr);

    try {
        logger.info("[Daily Briefing] Đang gọi AI tổng hợp bản tin 24h...");
        const response = await gateway.executeTask('DAILY_BRIEFING', prompt);
        
        let reportData = response;
        
        // Sửa lỗi mảng: Nếu AI tự ý bọc JSON trong một mảng (Array), ta lấy phần tử đầu tiên
        if (Array.isArray(response)) {
            reportData = response[0];
        }

        // --- BÓC TÁCH JSON VÀ RENDER THÀNH KHỐI HTML ĐẸP MẮT ---
        if (reportData && reportData.sections) {
            let html = `
            <div style="margin-bottom: 24px;">
                <h3 style="color: var(--md-sys-color-primary); font-size: 18px; font-weight: 800; margin-bottom: 8px; line-height: 1.4;">
                    ${reportData.title || 'AI DAILY BRIEFING'}
                </h3>
                <div style="font-size: 13px; opacity: 0.7; margin-bottom: 16px; font-style: italic; display: flex; align-items: center; gap: 4px;">
                    <span class="material-icons-round" style="font-size: 16px;">calendar_today</span> Cập nhật ngày: ${todayStr}
                </div>
                <p style="font-weight: 500; font-size: 15px; margin-bottom: 24px; line-height: 1.6;">
                    ${reportData.summary || ''}
                </p>
            </div>`;

            // Vẽ từng khối khu vực (Thẻ Card)
            reportData.sections.forEach(sec => {
                html += `
                <div style="margin-bottom: 20px; padding: 16px; background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline); border-radius: 12px; border-left: 4px solid var(--md-sys-color-primary);">
                    <h4 style="font-size: 15px; font-weight: bold; margin-bottom: 12px; color: var(--md-sys-color-on-surface); text-transform: uppercase;">
                        ${sec.region}
                    </h4>
                    <p style="font-size: 14.5px; line-height: 1.7; opacity: 0.9; margin: 0;">
                        ${sec.content}
                    </p>
                </div>`;
            });

            if (reportData.closing) {
                html += `<p style="font-size: 14px; opacity: 0.6; text-align: center; margin-top: 24px; font-style: italic;">${reportData.closing}</p>`;
            }

            return html;
        }

        // Fallback an toàn nếu AI trả về cấu trúc lạ
        return `<p>Không thể phân giải cấu trúc bản tin. Dữ liệu gốc: ${JSON.stringify(reportData)}</p>`;

    } catch (error) {
        logger.error("[Daily Briefing] Lỗi khi tạo bản tin 24h:", error);
        return `<p style="color: #ef4444;">Đã xảy ra lỗi hệ thống khi tạo bản tin 24h. Vui lòng kiểm tra file log.</p>`;
    }
}

module.exports = { generateDailyBriefing };

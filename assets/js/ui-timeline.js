// ==========================================================================
// FILE: assets/js/ui-timeline.js
// ==========================================================================
import { escapeHtml } from './utils.js';

export function renderTimelinePage(stories) {
    const container = document.getElementById('timeline-page-container');
    if (!container) return;
    const validStories = stories.filter(story => story.timeline && story.timeline.length > 1);
    validStories.sort((a, b) => b.last_updated - a.last_updated);
    if (validStories.length === 0) {
        container.innerHTML = '<p style="padding: 20px; opacity: 0.7;">Chưa có chuỗi sự kiện nào đủ dài để hiển thị.</p>';
        return;
    }
    let html = '';
    validStories.forEach(story => {
        let timelineNodes = '';
        const statusText = story.status === 'ongoing' ? 'Đang tiếp diễn' : 'Đã kết thúc';
        const statusColor = story.status === 'ongoing' ? '#10b981' : '#6b7280'; 
        
        story.timeline.forEach((item, index) => {
            let safeTimestamp = item.timestamp || item.time || item.date || story.last_updated;
            if (typeof safeTimestamp === 'string' && !isNaN(safeTimestamp)) {
                safeTimestamp = parseInt(safeTimestamp, 10);
            }
            const timeObj = new Date(safeTimestamp);
            let timeStr = "";
            if (!isNaN(timeObj.getTime())) {
                timeStr = `${timeObj.getHours().toString().padStart(2,'0')}:${timeObj.getMinutes().toString().padStart(2,'0')} - ${timeObj.toLocaleDateString('vi-VN')}`;
            } else {
                timeStr = "Vừa cập nhật";
            }
            const safeUrl = (item.url && item.url !== "undefined") ? item.url : "#";
            const titleHtml = safeUrl !== "#" 
                ? `<a href="${escapeHtml(safeUrl)}" target="_blank" style="color: inherit; text-decoration: underline;">${escapeHtml(item.title)}</a>` 
                : escapeHtml(item.title);
                
            timelineNodes += `
                <div style="display: flex; gap: 16px; margin-bottom: 16px; position: relative;">
                    ${index !== story.timeline.length - 1 ? '<div style="position: absolute; left: 5px; top: 20px; bottom: -20px; width: 2px; background: var(--md-sys-color-outline);"></div>' : ''}
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--md-sys-color-primary); margin-top: 5px; position: relative; z-index: 2; flex-shrink: 0;"></div>
                    <div>
                        <div style="font-size: 12px; color: var(--md-sys-color-primary); font-weight: bold; margin-bottom: 4px;">${timeStr}</div>
                        <div style="font-size: 14px; line-height: 1.5; font-weight: 500;">
                            ${titleHtml}
                        </div>
                        <div style="font-size: 13px; opacity: 0.7; margin-top: 4px;">${escapeHtml(item.summary)}</div>
                    </div>
                </div>
            `;
        });
        html += `
            <div class="widget" style="margin-bottom: 24px; border-left: 4px solid var(--md-sys-color-primary);">
                <div class="news-meta" style="margin-bottom: 12px;">
                    <span class="news-tag" style="background: ${statusColor}20; color: ${statusColor};">
                        ${statusText}
                    </span>
                </div>
                <h3 style="margin-bottom: 12px; font-size: 18px; line-height: 1.4;">${escapeHtml(story.title)}</h3>
                
                <div style="background: rgba(0,0,0,0.1); padding: 16px; border-radius: 8px; border: 1px solid var(--md-sys-color-outline); margin-top: 20px;">
                    ${timelineNodes}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==========================================================================
// FILE: assets/js/ui.js
// ==========================================================================
import { escapeHtml, getRegionLabel } from './utils.js';
import { openQuickBriefsModal, openModal } from './modal.js';
import { getGlobalNewsData } from './api.js';

export function renderSkeletons() {
    const newsContainer = document.getElementById('news-container');
    let skeletons = '';
    for (let i = 0; i < 5; i++) {
        skeletons += `
            <div class="skeleton-card">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width: 80%;"></div>
            </div>`;
    }
    newsContainer.innerHTML = skeletons;
}

// -------------------------------------------------------------------------
// [HÀM HELPER MỚI] - Xử lý gom nhóm theo ngày & Đẩy Modal tin vắn vào cuối mỗi ngày
// -------------------------------------------------------------------------
function renderGroupedItems(container, items, regionLabel) {
    // 1. Sắp xếp giảm dần theo thời gian (mới nhất lên đầu)
    const sortedItems = [...items].sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
    });

    // 2. Gom nhóm theo chuỗi ngày (VD: "24/07/2026")
    const grouped = [];
    sortedItems.forEach(item => {
        const timeObj = item.timestamp ? new Date(item.timestamp) : new Date();
        const dateStr = timeObj.toLocaleDateString('vi-VN');
        
        let group = grouped.find(g => g.dateStr === dateStr);
        if (!group) {
            group = { dateStr, items: [] };
            grouped.push(group);
        }
        group.items.push(item);
    });

    // 3. Render giao diện cho từng nhóm ngày
    grouped.forEach(group => {
        // Vẽ dải phân cách ngày
        const separator = document.createElement('div');
        separator.className = 'date-separator';
        separator.style.cssText = 'display: flex; align-items: center; margin: 24px 0 16px; opacity: 0.8;';
        separator.innerHTML = `
            <div style="flex-grow: 1; height: 1px; background: var(--md-sys-color-outline);"></div>
            <span style="padding: 0 12px; font-size: 13px; font-weight: 600; color: var(--md-sys-color-primary); text-transform: uppercase;">Ngày ${escapeHtml(group.dateStr)}</span>
            <div style="flex-grow: 1; height: 1px; background: var(--md-sys-color-outline);"></div>
        `;
        container.appendChild(separator);

        // Phân tách tin sâu và tin vắn của RIÊNG ngày này
        const deepItems = [];
        const quickItems = [];

        group.items.forEach(cluster => {
            if (cluster.detailed_summary === "Sự kiện nhỏ hoặc mang tính cập nhật nhanh, không yêu cầu phân tích chuyên sâu.") {
                quickItems.push(cluster);
            } else {
                deepItems.push(cluster);
            }
        });

        // Lần lượt render các tin phân tích chuyên sâu của ngày
        deepItems.forEach(cluster => {
            container.appendChild(renderNewsCard(cluster));
        });

        // Chốt lại ngày bằng 1 Thẻ "Điểm tin nhanh" gom tất cả sự kiện phụ của ngày đó
        if (quickItems.length > 0) {
            container.appendChild(renderQuickBriefsCard(quickItems, `${regionLabel} - ${group.dateStr}`));
        }
    });
}
// -------------------------------------------------------------------------

export function renderDigestFeed(digest) {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = '';

    const groups = [
        { key: 'vietnam', label: '🇻🇳 Việt Nam', items: digest.vietnam || [] },
        { key: 'asia',    label: '🌏 Châu Á',     items: digest.asia || [] },
        { key: 'global',  label: '🌍 Thế giới',   items: digest.global || [] }
    ];

    const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);
    if (totalItems === 0) {
        newsContainer.innerHTML = `<p style="padding: 20px; opacity: 0.7;">Chưa có sự kiện nổi bật nào trong chu kỳ này.</p>`;
        return;
    }

    const currentGlobalNewsData = getGlobalNewsData();

    groups.forEach(group => {
        if (group.items.length === 0) return;

        const groupHeader = document.createElement('div');
        groupHeader.className = 'section-header';
        groupHeader.style.marginTop = '20px';
        groupHeader.innerHTML = `<h2 class="section-title">${group.label} (${group.items.length})</h2>`;
        newsContainer.appendChild(groupHeader);

        const mappedItems = group.items.map(item => {
            return currentGlobalNewsData.find(t => t.event_key === item.event_key) || item;
        });

        // Áp dụng hàm helper mới cho "Bản tin nổi bật"
        renderGroupedItems(newsContainer, mappedItems, group.label);
    });
}

export function renderNewsFeed(newsData) {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = '';
    
    if (newsData.length === 0) {
        newsContainer.innerHTML = `<p style="padding: 20px; opacity: 0.7;">Không tìm thấy chủ đề nào phù hợp.</p>`;
        return;
    }

    // Áp dụng hàm helper mới cho "Tất cả bản tin"
    renderGroupedItems(newsContainer, newsData, 'Toàn cảnh');
}

export function renderQuickBriefsCard(quickItems, regionLabel) {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.style.transform = 'none'; 
    card.style.cursor = 'pointer';
    card.style.borderLeft = '4px solid var(--md-sys-color-surface-variant)';

    card.innerHTML = `
        <div class="news-meta">
            <span class="news-tag" style="background: rgba(15, 118, 110, 0.1); color: var(--md-sys-color-surface-variant);">${escapeHtml(regionLabel)}</span>
            <span>${quickItems.length} bản tin</span>
        </div>
        <h3><span class="material-icons-round" style="vertical-align: middle; color: var(--md-sys-color-surface-variant); font-size: 20px;">bolt</span> Điểm tin nhanh & Cập nhật</h3>
        <p>Tổng hợp ${quickItems.length} sự kiện vắn tắt, các thông báo và tình tiết đang phát triển không yêu cầu phân tích chuyên sâu.</p>
        <div class="news-footer">
            <span class="material-icons-round" style="font-size: 15px; color: var(--md-sys-color-surface-variant);">format_list_bulleted</span> Nhấn để xem danh sách chi tiết
        </div>
    `;
    
    card.addEventListener('click', () => openQuickBriefsModal(quickItems, regionLabel));
    return card;
}

export function renderNewsCard(cluster) {
    const timeObj = new Date(cluster.timestamp);
    const timeString = `${timeObj.getHours().toString().padStart(2,'0')}:${timeObj.getMinutes().toString().padStart(2,'0')} - ${timeObj.toLocaleDateString('vi-VN')}`;
    const mainRegion = (cluster.regions && cluster.regions.length > 0) ? getRegionLabel(cluster.regions[0]) : 'Thế giới';

    const sources = cluster.sources || [];
    const sourceCount = sources.length;
    const uniqueSourceNames = [...new Set(sources.map(s => s.source_name).filter(Boolean))];
    const uniqueCount = uniqueSourceNames.length;

    let sourceFooterHtml = '';
    if (sourceCount === 0) {
        sourceFooterHtml = `<span class="material-icons-round" style="font-size: 15px; color: var(--md-sys-color-primary);">smart_toy</span> Tổng hợp bởi AI`;
    } else if (uniqueCount === 1) {
        sourceFooterHtml = sourceCount > 1
            ? `<span class="material-icons-round" style="font-size: 15px; color: var(--md-sys-color-primary);">dynamic_feed</span> Tổng hợp từ nhiều bài viết của cùng một cơ quan báo chí`
            : `<span class="material-icons-round" style="font-size: 15px; color: var(--md-sys-color-primary);">article</span> Nguồn: ${escapeHtml(uniqueSourceNames[0])}`;
    } else {
        const topSources = uniqueSourceNames.slice(0, 2).map(escapeHtml).join(', ');
        const hasMore = uniqueCount > 2 ? ', ...' : '';
        sourceFooterHtml = `<span class="material-icons-round" style="font-size: 15px; color: var(--md-sys-color-primary);">fact_check</span> Nguồn: ${topSources}${hasMore} • Đối chiếu từ ${uniqueCount} nguồn báo chí`;
    }

    const card = document.createElement('div');
    card.className = 'news-card';
    card.innerHTML = `
        <div class="news-meta">
            <span class="news-tag">${escapeHtml(mainRegion)}</span>
            <span>${timeString}</span>
        </div>
        <h3>${escapeHtml(cluster.title || cluster.cluster_title)}</h3>
        <p>${escapeHtml(cluster.short_summary)}</p>
        <div class="news-footer">${sourceFooterHtml}</div>
    `;
    
    card.addEventListener('click', () => openModal(cluster));
    return card;
}

export function renderBriefing(briefingText) {
    const briefingContainer = document.getElementById('briefing-container');
    if (briefingText) {
        briefingContainer.innerHTML = `<p style="white-space: pre-wrap; font-size: 15px;">${briefingText}</p>`;
    } else {
        briefingContainer.innerHTML = '<p style="opacity:0.7;">Chưa có bản tin tóm tắt cho chu kỳ này.</p>';
    }
}

export function renderMarket(marketData) {
    const marketContainer = document.getElementById('market-container');
    if (!marketData || marketData.length === 0) {
        marketContainer.innerHTML = '<p style="opacity:0.7;">Đang chờ dữ liệu thị trường...</p>';
        return;
    }

    let alertsHtml = '';
    let gridHtml = '';

    marketData.forEach(item => {
        const isUp = item.trend === '↑' || item.trend === 'up' || item.change_percent.includes('+');
        const color = isUp ? '#10b981' : '#ef4444'; 
        const icon = isUp ? 'trending_up' : 'trending_down';
        const bgBadge = isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

        if (item.is_alert && item.context) {
            alertsHtml += `
                <div style="background: var(--md-sys-color-surface); padding: 16px; border-radius: 12px; border-left: 4px solid ${color}; border-top: 1px solid var(--md-sys-color-outline); border-right: 1px solid var(--md-sys-color-outline); border-bottom: 1px solid var(--md-sys-color-outline); margin-bottom: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <strong style="font-size: 16px;">${escapeHtml(item.name)}</strong>
                        <span style="background: ${bgBadge}; color: ${color}; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 15px; display: flex; align-items: center; gap: 4px;">
                            ${escapeHtml(item.change_percent)} <span class="material-icons-round" style="font-size: 16px;">${icon}</span>
                        </span>
                    </div>
                    
                    <div style="background: var(--md-sys-color-background); padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                        <div style="font-size: 12px; font-weight: bold; color: var(--md-sys-color-surface-variant); margin-bottom: 6px; text-transform: uppercase;">Nguyên nhân</div>
                        <ul style="margin: 0; padding-left: 16px; font-size: 14px; opacity: 0.9; line-height: 1.5;">
                            ${item.context.causes.map(c => `<li style="margin-bottom: 4px;">${escapeHtml(c)}</li>`).join('')}
                        </ul>
                    </div>

                    <div style="font-size: 14px; color: ${color}; font-weight: 500; display: flex; gap: 6px; align-items: flex-start;">
                        <span class="material-icons-round" style="font-size: 18px;">insights</span>
                        <span style="line-height: 1.4;">${escapeHtml(item.context.market_impact)}</span>
                    </div>
                </div>
            `;
        } else {
            gridHtml += `
                <div style="background: var(--md-sys-color-surface); padding: 12px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--md-sys-color-outline);">
                    <span style="font-size: 14px; opacity: 0.8; font-weight: 500;">${escapeHtml(item.name)}</span>
                    <div style="text-align: right;">
                        <div style="font-size: 15px; font-weight: bold;">${escapeHtml(item.price)}</div>
                        <div style="color: ${color}; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: flex-end; gap: 2px;">
                            ${escapeHtml(item.change_percent)} <span class="material-icons-round" style="font-size: 14px;">${icon}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    let finalHtml = '';
    if (alertsHtml) {
        finalHtml += `
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 13px; text-transform: uppercase; color: #ef4444; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 16px;">notifications_active</span> Biến động nổi bật
                </h3>
                ${alertsHtml}
            </div>
        `;
    }

    finalHtml += `
        <div>
            <h3 style="font-size: 13px; text-transform: uppercase; color: var(--md-sys-color-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                <span class="material-icons-round" style="font-size: 16px;">dashboard_customize</span> Bảng điều khiển
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
                ${gridHtml}
            </div>
        </div>
    `;
    marketContainer.innerHTML = finalHtml;
}

export function renderSocial(socialData) {
    const container = document.getElementById('social-container');
    if (!socialData || socialData.length === 0) {
        container.innerHTML = '<p style="opacity: 0.7; font-size: 13px;">Chưa có dữ liệu thảo luận.</p>';
        return;
    }
    let html = '';
    socialData.forEach(item => {
        html += `
            <div style="padding: 16px 0; border-bottom: 1px dashed var(--md-sys-color-outline);">
                <div style="font-weight: bold; font-size: 15px; margin-bottom: 8px; color: var(--md-sys-color-primary);">#${escapeHtml(item.keyword || 'Trending')}</div>
                <div style="font-size: 14px; opacity: 0.85; line-height: 1.5;">${escapeHtml(item.summary || item.content || 'Thảo luận đang tăng cao...')}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

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

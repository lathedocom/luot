// ==========================================================================
// FILE: assets/js/ui-news.js
// ==========================================================================
import { escapeHtml, getRegionLabel, formatVietnamTime } from './utils.js';
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

function renderGroupedItems(container, items, regionLabel) {
    const sortedItems = [...items].sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
    });

    const grouped = [];
    sortedItems.forEach(item => {
        const timeObj = item.timestamp ? new Date(item.timestamp) : new Date();
        
        // Sử dụng múi giờ VN để gom nhóm
        const formatter = new Intl.DateTimeFormat('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric', hour12: false
        });
        const parts = formatter.formatToParts(timeObj);
        const d = parts.find(p => p.type === 'day').value;
        const m = parts.find(p => p.type === 'month').value;
        const y = parts.find(p => p.type === 'year').value;
        const h = parts.find(p => p.type === 'hour').value;

        const dateStr = `${d}/${m}/${y}`;
        const hourStr = `${h}:00`;
        const groupKey = `${dateStr}_${hourStr}`;
        
        let group = grouped.find(g => g.groupKey === groupKey);
        if (!group) {
            group = { groupKey, dateStr, hourStr, items: [] };
            grouped.push(group);
        }
        group.items.push(item);
    });

    grouped.forEach(group => {
        const separator = document.createElement('div');
        separator.className = 'date-separator';
        separator.style.cssText = 'display: flex; align-items: center; margin: 24px 0 16px; opacity: 0.8;';
        separator.innerHTML = `
            <div style="flex-grow: 1; height: 1px; background: var(--md-sys-color-outline);"></div>
            <span style="padding: 0 12px; font-size: 13px; font-weight: 600; color: var(--md-sys-color-primary); text-transform: uppercase;">Cập nhật lúc ${escapeHtml(group.hourStr)} • ${escapeHtml(group.dateStr)}</span>
            <div style="flex-grow: 1; height: 1px; background: var(--md-sys-color-outline);"></div>
        `;
        container.appendChild(separator);

        const deepItems = [];
        const quickItems = [];

        group.items.forEach(cluster => {
            if (cluster.detailed_summary === "Sự kiện nhỏ hoặc mang tính cập nhật nhanh, không yêu cầu phân tích chuyên sâu.") {
                quickItems.push(cluster);
            } else {
                deepItems.push(cluster);
            }
        });

        deepItems.forEach(cluster => {
            container.appendChild(renderNewsCard(cluster));
        });

        if (quickItems.length > 0) {
            container.appendChild(renderQuickBriefsCard(quickItems, `${regionLabel} - Bản tin lúc ${group.hourStr}`));
        }
    });
}

export function renderDigestFeed(digest) {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = '';
    const groups = [
        { key: 'vietnam', label: '🇻🇳 Việt Nam', items: digest.vietnam || [] },
        { key: 'asia',    label: '🌏 Châu Á',     items: digest.asia || [] },
        { key: 'global',  label: '🌍 Thế giới',   items: digest.global || [] }
    ];

    const currentGlobalNewsData = getGlobalNewsData();
    groups.forEach(group => {
        if (group.items.length === 0) return;
        const groupHeader = document.createElement('div');
        groupHeader.className = 'section-header';
        groupHeader.style.marginTop = '20px';
        groupHeader.innerHTML = `<h2 class="section-title">${group.label} (${group.items.length})</h2>`;
        newsContainer.appendChild(groupHeader);
        const mappedItems = group.items.map(item => currentGlobalNewsData.find(t => t.event_key === item.event_key) || item);
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
        <p>Tổng hợp ${quickItems.length} sự kiện vắn tắt...</p>
        <div class="news-footer">
            <span class="material-icons-round" style="font-size: 15px; color: var(--md-sys-color-surface-variant);">format_list_bulleted</span> Nhấn để xem chi tiết
        </div>
    `;
    card.addEventListener('click', () => openQuickBriefsModal(quickItems, regionLabel));
    return card;
}

export function renderNewsCard(cluster) {
    const timeString = formatVietnamTime(cluster.timestamp); // Dùng hàm format mới
    const mainRegion = (cluster.regions && cluster.regions.length > 0) ? getRegionLabel(cluster.regions[0]) : 'Thế giới';

    // ... (Giữ nguyên logic render phần footer và impact)
    // Tôi rút gọn phần này để bạn dễ copy, giữ nguyên logic cũ
    let impactHtml = '';
    let borderStyle = '';
    if (cluster.impact_level) {
        const impactConfig = {
            'crisis': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Khủng hoảng', icon: 'error' },
            'risk': { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', label: 'Rủi ro', icon: 'warning' },
            'monitor': { color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', label: 'Theo dõi', icon: 'visibility' },
            'development': { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', label: 'Phát triển', icon: 'trending_up' }
        };
        const config = impactConfig[cluster.impact_level];
        if (config) {
            impactHtml = `<span class="news-tag" style="background: ${config.bg}; color: ${config.color}; display: inline-flex; align-items: center; gap: 4px;"><span class="material-icons-round" style="font-size: 14px;">${config.icon}</span> ${config.label}</span>`;
            borderStyle = `border-left: 4px solid ${config.color};`;
        }
    }

    const card = document.createElement('div');
    card.className = 'news-card';
    if (borderStyle) card.style.cssText = borderStyle; 
    
    card.innerHTML = `
        <div class="news-meta">
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="news-tag">${escapeHtml(mainRegion)}</span>
                ${impactHtml}
            </div>
            <span>${timeString}</span>
        </div>
        <h3>${escapeHtml(cluster.title || cluster.cluster_title)}</h3>
        <p>${escapeHtml(cluster.short_summary)}</p>
    `;
    card.addEventListener('click', () => openModal(cluster));
    return card;
}

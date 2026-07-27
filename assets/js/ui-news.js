// ==========================================================================
// FILE: assets/js/ui-news.js
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

    // [MỚI] Xử lý hiển thị Cấp độ ảnh hưởng (Impact Level)
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
    if (borderStyle) {
        card.style.cssText = borderStyle; // Đổ viền màu cạnh trái dựa theo cấp độ ảnh hưởng
    }

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
        <div class="news-footer">${sourceFooterHtml}</div>
    `;
    
    card.addEventListener('click', () => openModal(cluster));
    return card;
}

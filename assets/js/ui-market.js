// FILE: assets/js/ui-market.js
import { escapeHtml } from './utils.js';

export function renderMarket(marketData, macroHealthData = []) {
    const marketContainer = document.getElementById('market-container');
    if (!marketData || marketData.length === 0) {
        marketContainer.innerHTML = '<p style="opacity:0.7;">Đang chờ dữ liệu thị trường...</p>';
        return;
    }

    let finalHtml = '';

    // ==========================================
    // KHU VỰC 1: SỨC KHỎE NỀN KINH TẾ (MACRO HEALTH)
    // ==========================================
    if (macroHealthData.length > 0) {
        let healthCardsHtml = '';
        macroHealthData.forEach(item => {
            healthCardsHtml += `
                <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--md-sys-color-outline); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px;">${item.icon}</div>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 13px; opacity: 0.8; font-weight: 500;">${escapeHtml(item.name)}</span>
                        <span style="font-size: 15px; font-weight: bold; color: ${item.color};">${escapeHtml(item.status)}</span>
                    </div>
                </div>
            `;
        });

        finalHtml += `
            <div class="market-category-group" style="margin-bottom: 32px;">
                <h3 style="font-size: 16px; text-transform: uppercase; color: var(--md-sys-color-primary); margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                    <span class="material-icons-round">monitor_heart</span> SỨC KHỎE NỀN KINH TẾ
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    ${healthCardsHtml}
                </div>
            </div>
        `;
    }

    // ==========================================
    // KHU VỰC 2: BẢNG GIÁ THỊ TRƯỜNG THEO NHÓM
    // ==========================================
    const groupedData = {};
    marketData.forEach(item => {
        const category = item.category || 'Thị trường chung'; 
        if (!groupedData[category]) groupedData[category] = [];
        groupedData[category].push(item);
    });

    finalHtml += `
        <style>
            .market-board { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; align-items: start; width: 100%; box-sizing: border-box; }
            .market-category-group { display: flex; flex-direction: column; gap: 16px; width: 100%; box-sizing: border-box; }
            .chart-wrapper { position: relative; width: 100%; height: 60px; margin-bottom: 8px; overflow: hidden; }
            @media (max-width: 1200px) { .market-board { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
            @media (max-width: 1024px) { .market-board { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
            @media (max-width: 768px) { .market-board { grid-template-columns: minmax(0, 1fr); gap: 12px; } }
        </style>
    `;

    for (const [category, items] of Object.entries(groupedData)) {
        finalHtml += `
            <div class="market-category-group" style="margin-bottom: 24px;">
                <h3 style="font-size: 15px; text-transform: uppercase; color: var(--md-sys-color-primary); margin: 0 0 8px 0; border-bottom: 2px solid var(--md-sys-color-primary); padding-bottom: 8px;">
                    ${escapeHtml(category)}
                </h3>
                <div class="market-board">
        `;

        items.forEach((item, index) => {
            const chartId = `market-chart-${category.replace(/[^a-zA-Z0-9]/g, '-')}-${index}`;
            const isOffline = item.status === 'offline' || item.price === null;
            const displayPrice = isOffline ? '<span style="font-size: 13px; opacity: 0.6; font-style: italic;">Bảo trì</span>' : escapeHtml(item.price);
            const unitHtml = (!isOffline && item.unit) ? `<span style="font-size: 13px; font-weight: normal; opacity: 0.6; margin-left: 2px;">${escapeHtml(item.unit)}</span>` : '';
            
            const isUp = item.trend === '↑' || (item.change_percent && item.change_percent.includes('+'));
            const color = isOffline ? '#6b7280' : (isUp ? '#10b981' : '#ef4444'); 
            const bgBadge = isOffline ? 'transparent' : (isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)');
            const icon = isUp ? 'trending_up' : 'trending_down';

            const updateTime = new Date(item.updated_at || Date.now());
            const timeStr = `${updateTime.getHours().toString().padStart(2, '0')}:${updateTime.getMinutes().toString().padStart(2, '0')}`;
            let sourceLabel = isOffline ? 'Dữ liệu tạm ngưng' : escapeHtml(item.display_source || 'Hệ thống');

            const chartContainerHtml = isOffline 
                ? `<div style="height: 60px; display: flex; align-items: center; justify-content: center; opacity: 0.2; font-size: 11px;">(Đang gián đoạn)</div>`
                : `<div class="chart-wrapper"><canvas id="${chartId}"></canvas></div>`;

            finalHtml += `
                <div class="market-card" style="background: var(--md-sys-color-surface); padding: 12px; border-radius: 10px; border: 1px solid var(--md-sys-color-outline); display: flex; flex-direction: column; position: relative; min-height: 160px;">
                    <div style="position: absolute; top: 0; left: 0; bottom: 0; width: 4px; background-color: ${color}; border-top-left-radius: 10px; border-bottom-left-radius: 10px;"></div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; padding-left: 6px;">
                        <div style="flex: 1; display: flex; flex-direction: column;">
                            <h4 style="margin: 0; font-size: 14px; font-weight: 600; opacity: 0.8; line-height: 1.3;">${escapeHtml(item.name)}</h4>
                            <div style="font-size: 16px; font-weight: bold; margin-top: 2px;">${displayPrice} ${unitHtml}</div>
                        </div>
                        ${!isOffline ? `<span style="background: ${bgBadge}; color: ${color}; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 2px;">${escapeHtml(item.change_percent)}</span>` : ''}
                    </div>
                    
                    ${chartContainerHtml}

                    <div style="margin-top: auto; padding-top: 8px; font-size: 10px; opacity: 0.6; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(128,128,128,0.1);">
                        <span>Cập nhật: ${timeStr}</span>
                        <span>${sourceLabel}</span>
                    </div>
                </div>
            `;
        });

        finalHtml += `</div></div>`;
    }

    marketContainer.innerHTML = finalHtml;

    // Kích hoạt vẽ biểu đồ
    if (typeof Chart !== 'undefined') {
        for (const [category, items] of Object.entries(groupedData)) {
            items.forEach((item, index) => {
                if (item.status !== 'offline' && item.history && item.history.length > 0) {
                    drawMarketSparkline(`market-chart-${category.replace(/[^a-zA-Z0-9]/g, '-')}-${index}`, item);
                }
            });
        }
    }
}

function drawMarketSparkline(canvasId, item) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const data = item.history.length === 1 ? [item.history[0] * 0.99, item.history[0]] : item.history;
    const labels = item.history_labels.length === 1 ? ['T-1', item.history_labels[0]] : item.history_labels;
    
    const isUp = item.trend === '↑' || (item.change_percent && item.change_percent.includes('+'));
    const lineColor = isUp ? '#10b981' : '#ef4444'; 
    const bgColor = isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: [{ data: data, borderColor: lineColor, backgroundColor: bgColor, borderWidth: 1.5, pointRadius: 0, fill: true, tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false } }, scales: { x: { display: false }, y: { display: false }  }, interaction: { mode: 'nearest', axis: 'x', intersect: false }, layout: { padding: 0 } }
    });
}

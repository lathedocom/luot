// FILE: assets/js/ui-market.js
import { escapeHtml } from './utils.js';

export function renderMarket(marketData) {
    const marketContainer = document.getElementById('market-container');
    if (!marketData || marketData.length === 0) {
        marketContainer.innerHTML = '<p style="opacity:0.7;">Đang chờ dữ liệu thị trường...</p>';
        return;
    }

    const groupedData = {};
    marketData.forEach(item => {
        const category = item.category || 'Thị trường chung'; 
        const region = item.region || 'global';

        if (!groupedData[category]) groupedData[category] = { vn: [], global: [] };
        if (region === 'vn') groupedData[category].vn.push(item);
        else groupedData[category].global.push(item);
    });

    let finalHtml = `
        <style>
            .market-board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; align-items: start; width: 100%; box-sizing: border-box; }
            .market-category-group { display: flex; flex-direction: column; gap: 16px; width: 100%; box-sizing: border-box; }
            .chart-wrapper { position: relative; width: 100%; height: 80px; margin-bottom: 8px; overflow: hidden; }
            @media (max-width: 1024px) { .market-board { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
            @media (max-width: 768px) { .market-board { grid-template-columns: minmax(0, 1fr); gap: 12px; } }
        </style>
        <div class="market-board">
    `;

    for (const [category, regions] of Object.entries(groupedData)) {
        finalHtml += `
            <div class="market-category-group">
                <h3 style="font-size: 15px; text-transform: uppercase; color: var(--md-sys-color-primary); margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid var(--md-sys-color-primary); padding-bottom: 8px;">
                    ${escapeHtml(category)}
                </h3>
                <div style="display: flex; flex-direction: column; gap: 16px; width: 100%;">
        `;

        const renderRegionItems = (items, regionLabel, flagIcon, suffix) => {
            if (items.length === 0) return '';
            
            let regionHtml = '';
            if (category !== '🪙 Tiền điện tử') {
                regionHtml += `<div style="font-size: 13px; font-weight: bold; color: var(--md-sys-color-on-surface); opacity: 0.7; margin-top: 4px; margin-bottom: 0px; border-bottom: 1px dashed var(--md-sys-color-outline); padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    <span>${flagIcon}</span> ${regionLabel}
                </div>`;
            }

            items.forEach((item, index) => {
                const chartId = `market-chart-${category.replace(/[^a-zA-Z0-9]/g, '-')}-${suffix}-${index}`;
                
                // KIỂM TRA TRẠNG THÁI OFFLINE (Bắt lỗi rõ ràng)
                const isOffline = item.status === 'offline' || item.price === null;
                const displayPrice = isOffline ? '<span style="font-size: 14px; opacity: 0.6; font-style: italic;">Không có dữ liệu</span>' : escapeHtml(item.price);
                const unitHtml = (!isOffline && item.unit) ? `<span style="font-size: 14px; font-weight: normal; opacity: 0.6; margin-left: 2px;">${escapeHtml(item.unit)}</span>` : '';
                
                const isUp = item.trend === '↑' || (item.change_percent && item.change_percent.includes('+'));
                const color = isOffline ? '#6b7280' : (isUp ? '#10b981' : '#ef4444'); 
                const bgBadge = isOffline ? 'transparent' : (isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)');
                const icon = isUp ? 'trending_up' : 'trending_down';

                // Lấy giờ cập nhật
                const updateTime = new Date(item.updated_at || Date.now());
                const timeStr = `${updateTime.getHours().toString().padStart(2, '0')}:${updateTime.getMinutes().toString().padStart(2, '0')}`;

                let sourceIcon = isOffline ? 'warning_amber' : 'source';
                let sourceColor = isOffline ? '#f59e0b' : 'var(--md-sys-color-on-surface)';
                let sourceLabel = isOffline ? '⚠ Nguồn bảo trì' : escapeHtml(item.display_source || 'Hệ thống');

                // Nếu Offline, chặn hiển thị Canvas biểu đồ
                const chartContainerHtml = isOffline 
                    ? `<div style="height: 80px; display: flex; align-items: center; justify-content: center; opacity: 0.2; font-size: 12px;">(Biểu đồ tạm ngưng)</div>`
                    : `<div class="chart-wrapper"><canvas id="${chartId}"></canvas></div>`;

                regionHtml += `
                    <div class="market-card" style="background: var(--md-sys-color-surface); padding: 16px; border-radius: 12px; border: 1px solid var(--md-sys-color-outline); box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; position: relative; min-height: 220px;">
                        <div style="position: absolute; top: 0; left: 0; bottom: 0; width: 4px; background-color: ${color}; border-top-left-radius: 12px; border-bottom-left-radius: 12px;"></div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding-left: 8px;">
                            <div style="flex: 1; display: flex; flex-direction: column;">
                                <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: var(--md-sys-color-on-surface); opacity: 0.8; line-height: 1.4;">${escapeHtml(item.name)}</h4>
                                <div style="font-size: 18px; font-weight: bold; margin-top: 4px; color: var(--md-sys-color-on-surface);">${displayPrice} ${unitHtml}</div>
                            </div>
                            ${!isOffline ? `<span style="background: ${bgBadge}; color: ${color}; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 2px;">${escapeHtml(item.change_percent)} <span class="material-icons-round" style="font-size: 16px;">${icon}</span></span>` : ''}
                        </div>
                        
                        ${chartContainerHtml}

                        <div style="margin-top: auto; padding-top: 12px; font-size: 11px; color: ${sourceColor}; opacity: 0.6; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(128,128,128,0.1);">
                            <span>Cập nhật: ${timeStr}</span>
                            <span style="display: flex; align-items: center; gap: 4px;">
                                <span class="material-icons-round" style="font-size: 14px;">${sourceIcon}</span>
                                ${sourceLabel}
                            </span>
                        </div>
                    </div>
                `;
            });
            return regionHtml;
        };

        finalHtml += renderRegionItems(regions.vn, 'VIỆT NAM', '🇻🇳', 'vn');
        finalHtml += renderRegionItems(regions.global, 'QUỐC TẾ', '🌍', 'gl');
        finalHtml += `</div></div>`;
    }
    finalHtml += `</div>`; 
    marketContainer.innerHTML = finalHtml;

    if (typeof Chart !== 'undefined') {
        for (const [category, regions] of Object.entries(groupedData)) {
            const drawIfValid = (item, suffix, idx) => {
                // CHỈ VẼ CHART NẾU CÓ DỮ LIỆU LỊCH SỬ VÀ TRẠNG THÁI ONLINE
                if (item.status !== 'offline' && item.history && item.history.length > 0) {
                    drawMarketSparkline(`market-chart-${category.replace(/[^a-zA-Z0-9]/g, '-')}-${suffix}-${idx}`, item);
                }
            };
            regions.vn.forEach((item, idx) => drawIfValid(item, 'vn', idx));
            regions.global.forEach((item, idx) => drawIfValid(item, 'gl', idx));
        }
    }
}

function drawMarketSparkline(canvasId, item) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Nếu API chỉ trả về 1 điểm dữ liệu hôm nay, tạo điểm nền ảo để không bị crash Chart.js
    const data = item.history.length === 1 ? [item.history[0] * 0.99, item.history[0]] : item.history;
    const labels = item.history_labels.length === 1 ? ['T-1', item.history_labels[0]] : item.history_labels;
    
    const isUp = item.trend === '↑' || (item.change_percent && item.change_percent.includes('+'));
    const lineColor = isUp ? '#10b981' : '#ef4444'; 
    const bgColor = isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                borderColor: lineColor,
                backgroundColor: bgColor,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
            plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false } },
            scales: { x: { display: false }, y: { display: false }  },
            interaction: { mode: 'nearest', axis: 'x', intersect: false },
            layout: { padding: 0 }
        }
    });
}

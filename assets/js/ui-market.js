// ==========================================================================
// FILE: assets/js/ui-market.js
// ==========================================================================
import { escapeHtml } from './utils.js';

export function renderMarket(marketData) {
    const marketContainer = document.getElementById('market-container');
    if (!marketData || marketData.length === 0) {
        marketContainer.innerHTML = '<p style="opacity:0.7;">Đang chờ dữ liệu thị trường...</p>';
        return;
    }

    // 1. Phân loại dữ liệu 2 cấp: Category -> Region
    const groupedData = {};
    marketData.forEach(item => {
        const category = item.category || 'Thị trường chung'; 
        const region = item.region || 'global';

        if (!groupedData[category]) {
            groupedData[category] = { vn: [], global: [] };
        }
        
        if (region === 'vn') {
            groupedData[category].vn.push(item);
        } else {
            groupedData[category].global.push(item);
        }
    });

    let finalHtml = `
        <style>
            .market-board {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr)); 
                gap: 24px;
                align-items: start; 
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
            }
            .market-category-group {
                display: flex;
                flex-direction: column;
                gap: 16px;
                min-width: 0;
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
            }
            .chart-wrapper {
                position: relative;
                width: 100%;
                height: 80px;
                max-width: 100%;
                margin-bottom: 8px;
                overflow: hidden; 
            }
            @media (max-width: 1024px) {
                .market-board { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            @media (max-width: 768px) {
                .market-board { grid-template-columns: minmax(0, 1fr); gap: 12px; }
            }
        </style>
        <div class="market-board">
    `;

    // 2. Render từng lĩnh vực và theo từng khu vực
    for (const [category, regions] of Object.entries(groupedData)) {
        // Chỉ render category header nếu category đó tên không phải là label tự sinh
        finalHtml += `
            <div class="market-category-group">
                <h3 style="font-size: 15px; text-transform: uppercase; color: var(--md-sys-color-primary); margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid var(--md-sys-color-primary); padding-bottom: 8px;">
                    ${escapeHtml(category)}
                </h3>
                <div style="display: flex; flex-direction: column; gap: 16px; min-width: 0; width: 100%;">
        `;

        // Hàm render cho từng nhóm khu vực
        const renderRegionItems = (items, regionLabel, flagIcon, suffix) => {
            if (items.length === 0) return '';
            
            let regionHtml = '';
            // Ẩn Header khu vực đối với Crypto vì toàn bộ là Global
            if (category !== '🪙 Tiền điện tử') {
                regionHtml += `
                    <div style="font-size: 13px; font-weight: bold; color: var(--md-sys-color-on-surface); opacity: 0.7; margin-top: 4px; margin-bottom: 0px; border-bottom: 1px dashed var(--md-sys-color-outline); padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                        <span>${flagIcon}</span> ${regionLabel}
                    </div>
                `;
            }

            items.forEach((item, index) => {
                const isUp = item.trend === '↑' || item.trend === 'up' || (item.change_percent && item.change_percent.includes('+'));
                const color = isUp ? '#10b981' : '#ef4444'; 
                const icon = isUp ? 'trending_up' : 'trending_down';
                const bgBadge = isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                
                const unitHtml = item.unit ? `<span style="font-size: 14px; font-weight: normal; opacity: 0.6; margin-left: 2px;">${escapeHtml(item.unit)}</span>` : '';
                
                // Đảm bảo ID canvas là duy nhất
                const chartId = `market-chart-${category.replace(/[^a-zA-Z0-9]/g, '-')}-${suffix}-${index}`;

                let contextHtml = '';
                if (item.context && item.context.causes && item.context.causes.length > 0) {
                    contextHtml = `
                        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed var(--md-sys-color-outline); width: 100%; max-width: 100%; box-sizing: border-box;">
                            <div style="font-size: 12px; font-weight: bold; color: var(--md-sys-color-surface-variant); margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
                                <span class="material-icons-round" style="font-size: 14px;">info</span> Nguyên nhân biến động
                            </div>
                            <ul style="margin: 0; padding-left: 16px; font-size: 13px; opacity: 0.9; line-height: 1.5; box-sizing: border-box;">
                                ${item.context.causes.map(c => `<li style="margin-bottom: 4px; word-break: break-word;">${escapeHtml(c)}</li>`).join('')}
                            </ul>
                            ${item.context.market_impact ? `
                            <div style="font-size: 13px; color: ${color}; font-weight: 500; margin-top: 8px; display: flex; gap: 6px; align-items: flex-start; word-break: break-word;">
                                <span class="material-icons-round" style="font-size: 16px; flex-shrink: 0;">insights</span>
                                <span style="line-height: 1.4;">${escapeHtml(item.context.market_impact)}</span>
                            </div>` : ''}
                        </div>
                    `;
                }

                let sourceColor = item.display_source && item.display_source.includes('Mô phỏng') ? '#f59e0b' : 'var(--md-sys-color-on-surface)';
                const sourceHtml = `
                    <div style="margin-top: auto; padding-top: 12px; font-size: 11px; color: ${sourceColor}; opacity: 0.6; display: flex; justify-content: flex-end; align-items: center; gap: 4px; border-top: 1px solid rgba(128,128,128,0.1);">
                        <span class="material-icons-round" style="font-size: 14px;">${item.display_source && item.display_source.includes('Mô phỏng') ? 'warning_amber' : 'source'}</span>
                        ${escapeHtml(item.display_source || 'Tổng hợp')}
                    </div>
                `;

                regionHtml += `
                    <div class="market-card" style="background: var(--md-sys-color-surface); padding: 16px; border-radius: 12px; border: 1px solid var(--md-sys-color-outline); box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; position: relative; width: 100%; max-width: 100%; box-sizing: border-box; min-height: 220px;">
                        <div style="position: absolute; top: 0; left: 0; bottom: 0; width: 4px; background-color: ${color}; border-top-left-radius: 12px; border-bottom-left-radius: 12px;"></div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding-left: 8px; gap: 8px; width: 100%; box-sizing: border-box;">
                            <div style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
                                <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: var(--md-sys-color-on-surface); opacity: 0.8; word-break: break-word; line-height: 1.4;">${escapeHtml(item.name)}</h4>
                                <div style="font-size: 18px; font-weight: bold; margin-top: 4px; color: var(--md-sys-color-on-surface); word-break: break-word;">
                                    ${escapeHtml(item.price)} ${unitHtml}
                                </div>
                            </div>
                            <span style="background: ${bgBadge}; color: ${color}; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 2px; flex-shrink: 0; white-space: nowrap;">
                                ${escapeHtml(item.change_percent)} <span class="material-icons-round" style="font-size: 16px;">${icon}</span>
                            </span>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="${chartId}"></canvas>
                        </div>
                        ${contextHtml}
                        ${sourceHtml}
                    </div>
                `;
            });
            return regionHtml;
        };

        // Ưu tiên hiển thị Việt Nam trước, Quốc tế sau
        finalHtml += renderRegionItems(regions.vn, 'VIỆT NAM', '🇻🇳', 'vn');
        finalHtml += renderRegionItems(regions.global, 'QUỐC TẾ', '🌍', 'gl');

        finalHtml += `</div></div>`;
    }

    finalHtml += `</div>`; 
    marketContainer.innerHTML = finalHtml;

    // 4. Vẽ biểu đồ 
    if (typeof Chart !== 'undefined') {
        for (const [category, regions] of Object.entries(groupedData)) {
            regions.vn.forEach((item, idx) => {
                const chartId = `market-chart-${category.replace(/[^a-zA-Z0-9]/g, '-')}-vn-${idx}`;
                drawMarketSparkline(chartId, item);
            });
            regions.global.forEach((item, idx) => {
                const chartId = `market-chart-${category.replace(/[^a-zA-Z0-9]/g, '-')}-gl-${idx}`;
                drawMarketSparkline(chartId, item);
            });
        }
    } else {
        console.warn("Chưa tải thư viện Chart.js.");
    }
}

function drawMarketSparkline(canvasId, item) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const data = item.history && item.history.length > 0 ? item.history : [10, 15, 13, 20, 18, 25];
    const labels = item.history_labels && item.history_labels.length > 0 ? item.history_labels : data.map((_, i) => `T${i}`);
    
    const isUp = item.trend === '↑' || item.trend === 'up' || (item.change_percent && item.change_percent.includes('+'));
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
            plugins: { 
                legend: { display: false }, 
                tooltip: { 
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    displayColors: false
                } 
            },
            scales: {
                x: { display: false }, 
                y: { display: false }  
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            layout: { padding: 0 }
        }
    });
}

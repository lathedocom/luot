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

// ==========================================================================
// FILE: assets/js/ui-market.js
// ==========================================================================
import { escapeHtml } from './utils.js';

export function renderMarket(marketData, macroHealthData = []) {
    const marketContainer = document.getElementById('market-container');
    if (!marketData || marketData.length === 0) {
        marketContainer.innerHTML = '<p style="opacity:0.7;">Đang chờ dữ liệu thị trường...</p>';
        return;
    }

    // BỌC TOÀN BỘ BẰNG 1 THẺ BLOCK ĐỂ THOÁT KHỎI LỖI GRID CỦA HTML GỐC
    let finalHtml = '<div style="display: block; width: 100%; grid-column: 1 / -1;">';

    // ==========================================
    // KHU VỰC 1: SỨC KHỎE NỀN KINH TẾ (THẺ 3 LỚP - CHUẨN 3 CỘT)
    // ==========================================
    if (macroHealthData.length > 0) {
        let healthCardsHtml = '';
        macroHealthData.forEach(item => {
            // Render 3 lý do
            let reasonsHtml = '';
            if (item.reasons && item.reasons.length > 0) {
                item.reasons.forEach(r => {
                    reasonsHtml += `<li style="margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(r)}</li>`;
                });
            } else {
                reasonsHtml = '<li>Đang cập nhật diễn biến thị trường...</li>';
            }

            // Mã hóa dữ liệu để truyền vào thuộc tính DOM an toàn
            const eventsJson = encodeURIComponent(JSON.stringify(item.events || []));

            healthCardsHtml += `
                <div class="health-card" data-title="${escapeHtml(item.name)}" data-status="${escapeHtml(item.status)}" data-color="${item.color}" data-events="${eventsJson}" style="background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline); border-top: 4px solid ${item.color}; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; box-shadow: 0 4px 6px rgba(0,0,0,0.02); cursor: pointer; transition: transform 0.2s, background 0.2s; min-height: 180px;">
                    
                    <!-- Lớp 1: Header & Trạng thái -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 20px;">${item.icon}</span>
                            <span style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: var(--md-sys-color-on-surface); opacity: 0.9;">${escapeHtml(item.name)}</span>
                        </div>
                    </div>
                    <div style="font-size: 16px; font-weight: bold; color: ${item.color}; margin-bottom: 6px;">
                        ${escapeHtml(item.status)}
                    </div>
                    
                    <!-- Lớp 2: Xu hướng -->
                    <div style="font-size: 13px; font-weight: 600; color: var(--md-sys-color-on-surface); opacity: 0.7; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
                        <span style="font-size: 16px; font-weight: 900;">${item.trend_icon}</span> ${escapeHtml(item.trend_text)}
                    </div>

                    <!-- Lớp 3: Nguyên nhân chính -->
                    <div style="background: rgba(0,0,0,0.1); padding: 10px; border-radius: 8px; flex-grow: 1;">
                        <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; opacity: 0.6; margin-bottom: 6px;">Nguyên nhân chính</div>
                        <ul style="margin: 0; padding-left: 16px; font-size: 12px; opacity: 0.85; line-height: 1.4;">
                            ${reasonsHtml}
                        </ul>
                    </div>
                </div>
            `;
        });

        finalHtml += `
            <div class="market-category-group" style="margin-bottom: 32px;">
                <h3 style="font-size: 18px; font-weight: 700; color: var(--md-sys-color-primary); margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
                    <span class="material-icons-round">monitor_heart</span> SỨC KHỎE NỀN KINH TẾ
                </h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;" class="health-grid">
                    ${healthCardsHtml}
                </div>
            </div>
        `;
    }

    // ==========================================
    // KHU VỰC 2: BẢNG GIÁ THỊ TRƯỜNG THEO NHÓM (CHUẨN 3 CỘT)
    // ==========================================
    const groupedData = {};
    marketData.forEach(item => {
        const category = item.category || 'Thị trường chung'; 
        if (!groupedData[category]) groupedData[category] = [];
        groupedData[category].push(item);
    });

    finalHtml += `
        <style>
            .market-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; align-items: start; width: 100%; box-sizing: border-box; }
            .market-category-group { display: flex; flex-direction: column; width: 100%; box-sizing: border-box; }
            .chart-wrapper { position: relative; width: 100%; height: 60px; margin-bottom: 8px; overflow: hidden; }
            
            /* Hiệu ứng rê chuột cho thẻ sức khỏe */
            .health-card:hover { background: rgba(59, 130, 246, 0.08) !important; transform: translateY(-2px); }
            
            /* Reponsive cho Mobile và Tablet */
            @media (max-width: 1024px) { 
                .market-board { grid-template-columns: repeat(2, 1fr); } 
                .health-grid { grid-template-columns: repeat(2, 1fr) !important; }
            }
            @media (max-width: 768px) { 
                .market-board { grid-template-columns: 1fr; gap: 12px; } 
                .health-grid { grid-template-columns: 1fr !important; gap: 12px; }
            }
        </style>
    `;

    for (const [category, items] of Object.entries(groupedData)) {
        finalHtml += `
            <div class="market-category-group" style="margin-bottom: 24px;">
                <h3 style="font-size: 15px; text-transform: uppercase; color: var(--md-sys-color-primary); margin: 0 0 16px 0; border-bottom: 2px solid var(--md-sys-color-primary); padding-bottom: 8px;">
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

    finalHtml += `</div>`; // Đóng Wrapper to nhất
    marketContainer.innerHTML = finalHtml;

    // ==========================================
    // KHU VỰC 3: XỬ LÝ SỰ KIỆN CLICK (MODAL) VÀ VẼ BIỂU ĐỒ
    // ==========================================

    // Kích hoạt sự kiện bấm vào Thẻ Sức Khỏe Nền Kinh Tế để mở Modal
    document.querySelectorAll('.health-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.getAttribute('data-title');
            const status = card.getAttribute('data-status');
            const color = card.getAttribute('data-color');
            const eventsStr = card.getAttribute('data-events');
            
            let events = [];
            try { events = JSON.parse(decodeURIComponent(eventsStr)); } catch(err){}

            openMacroHealthModal(title, status, color, events);
        });
    });

    // Vẽ biểu đồ Chart.js
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

// Hàm render Modal lý do đánh giá
function openMacroHealthModal(title, status, color, reasons, target, impact_level, duration, meaning) {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    document.getElementById('modal-reliability').innerHTML = '';
    document.getElementById('modal-mini-timeline').style.display = 'none';
    document.getElementById('toggle-sources-btn').style.display = 'none';
    document.getElementById('modal-sources').style.display = 'none';

    modalTitle.innerHTML = `<span style="color:${color}">${title}</span>`;

    let reasonsHtml = '';
    if (reasons && reasons.length > 0) {
        reasons.forEach(r => {
            reasonsHtml += `<li style="margin-bottom: 8px;">${escapeHtml(r)}</li>`;
        });
    }

    modalBody.innerHTML = `
        <div style="background: rgba(0,0,0,0.05); border-left: 4px solid ${color}; padding: 16px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; opacity: 0.7; margin-bottom: 4px;">TRẠNG THÁI:</div>
                <div style="font-size: 20px; font-weight: bold; color: ${color};">${status}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; opacity: 0.7; margin-bottom: 4px;">THỜI GIAN:</div>
                <div style="font-size: 14px; font-weight: 600; color: var(--md-sys-color-on-surface);">${escapeHtml(duration)}</div>
            </div>
        </div>

        <div style="margin-bottom: 20px;">
            <div style="font-size: 13px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; color: var(--md-sys-color-primary);">
                <span class="material-icons-round" style="font-size: 16px; vertical-align: text-bottom;">info</span> Điều gì vừa xảy ra?
            </div>
            <ul style="margin: 0; padding-left: 16px; font-size: 14px; opacity: 0.9; line-height: 1.6; color: var(--md-sys-color-on-surface);">
                ${reasonsHtml}
            </ul>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
            <div style="background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline); padding: 16px; border-radius: 8px;">
                <div style="font-size: 12px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; opacity: 0.7;">Ai bị ảnh hưởng?</div>
                <div style="font-size: 14px; font-weight: 500; color: var(--md-sys-color-primary);">${escapeHtml(target)}</div>
            </div>
            <div style="background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline); padding: 16px; border-radius: 8px;">
                <div style="font-size: 12px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; opacity: 0.7;">Mức độ tác động</div>
                <div style="font-size: 14px; font-weight: bold;">${escapeHtml(impact_level)}</div>
            </div>
        </div>

        <div style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); padding: 16px; border-radius: 8px;">
            <div style="font-size: 13px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; color: #3b82f6;">
                <span class="material-icons-round" style="font-size: 16px; vertical-align: text-bottom;">lightbulb</span> Tác động thực tế
            </div>
            <p style="font-size: 14px; opacity: 0.9; line-height: 1.6; margin: 0; color: var(--md-sys-color-on-surface);">
                ${escapeHtml(meaning)}
            </p>
        </div>
    `;

    document.getElementById('intelligence-modal').classList.add('active');
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

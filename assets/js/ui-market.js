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

    // 1. Phân loại dữ liệu theo lĩnh vực (category)
    const groupedData = {};
    marketData.forEach(item => {
        const category = item.category || 'Thị trường chung'; // Mặc định nếu không có category
        if (!groupedData[category]) {
            groupedData[category] = [];
        }
        groupedData[category].push(item);
    });

    let finalHtml = '';

    // 2. Render từng lĩnh vực
    for (const [category, items] of Object.entries(groupedData)) {
        finalHtml += `
            <div style="margin-bottom: 32px;">
                <h3 style="font-size: 15px; text-transform: uppercase; color: var(--md-sys-color-primary); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid var(--md-sys-color-primary); padding-bottom: 8px;">
                    <span class="material-icons-round">category</span> ${escapeHtml(category)}
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
        `;

        // 3. Render từng thẻ chỉ số
        items.forEach((item, index) => {
            const isUp = item.trend === '↑' || item.trend === 'up' || (item.change_percent && item.change_percent.includes('+'));
            const color = isUp ? '#10b981' : '#ef4444'; 
            const icon = isUp ? 'trending_up' : 'trending_down';
            const bgBadge = isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            
            // Xử lý đơn vị
            const unitHtml = item.unit ? `<span style="font-size: 14px; font-weight: normal; opacity: 0.6; margin-left: 2px;">${escapeHtml(item.unit)}</span>` : '';
            
            // Tạo ID duy nhất cho thẻ canvas để vẽ biểu đồ
            const chartId = `market-chart-${category.replace(/[^a-zA-Z0-9]/g, '-')}-${index}`;

            // Xử lý hiển thị bảng lý do tác động
            let contextHtml = '';
            if (item.context && item.context.causes && item.context.causes.length > 0) {
                contextHtml = `
                    <div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed var(--md-sys-color-outline);">
                        <div style="font-size: 12px; font-weight: bold; color: var(--md-sys-color-surface-variant); margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
                            <span class="material-icons-round" style="font-size: 14px;">info</span> Nguyên nhân biến động
                        </div>
                        <ul style="margin: 0; padding-left: 16px; font-size: 13px; opacity: 0.9; line-height: 1.5;">
                            ${item.context.causes.map(c => `<li style="margin-bottom: 4px;">${escapeHtml(c)}</li>`).join('')}
                        </ul>
                        ${item.context.market_impact ? `
                        <div style="font-size: 13px; color: ${color}; font-weight: 500; margin-top: 8px; display: flex; gap: 6px; align-items: flex-start;">
                            <span class="material-icons-round" style="font-size: 16px;">insights</span>
                            <span style="line-height: 1.4;">${escapeHtml(item.context.market_impact)}</span>
                        </div>` : ''}
                    </div>
                `;
            }

            finalHtml += `
                <div class="market-card" style="background: var(--md-sys-color-surface); padding: 16px; border-radius: 12px; border: 1px solid var(--md-sys-color-outline); box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; position: relative; overflow: hidden;">
                    
                    <!-- Dải màu thể hiện xu hướng ở cạnh trái -->
                    <div style="position: absolute; top: 0; left: 0; bottom: 0; width: 4px; background-color: ${color};"></div>

                    <!-- Header: Tên, Giá, Phần trăm -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding-left: 8px;">
                        <div>
                            <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: var(--md-sys-color-on-surface); opacity: 0.8;">${escapeHtml(item.name)}</h4>
                            <div style="font-size: 22px; font-weight: bold; margin-top: 4px; color: var(--md-sys-color-on-surface);">
                                ${escapeHtml(item.price)} ${unitHtml}
                            </div>
                        </div>
                        <span style="background: ${bgBadge}; color: ${color}; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 4px;">
                            ${escapeHtml(item.change_percent)} <span class="material-icons-round" style="font-size: 16px;">${icon}</span>
                        </span>
                    </div>

                    <!-- Khung chứa Biểu đồ -->
                    <div style="width: 100%; height: 80px; margin-bottom: 8px; position: relative;">
                        <canvas id="${chartId}"></canvas>
                    </div>

                    <!-- Nguyên nhân thay đổi -->
                    ${contextHtml}
                </div>
            `;
        });

        finalHtml += `</div></div>`;
    }

    marketContainer.innerHTML = finalHtml;

    // 4. Vẽ biểu đồ sau khi các thẻ canvas đã được đưa vào DOM
    if (typeof Chart !== 'undefined') {
        for (const [category, items] of Object.entries(groupedData)) {
            items.forEach((item, idx) => {
                const chartId = `market-chart-${category.replace(/[^a-zA-Z0-9]/g, '-')}-${idx}`;
                drawMarketSparkline(chartId, item);
            });
        }
    } else {
        console.warn("Chưa tải thư viện Chart.js. Vui lòng chèn script Chart.js vào file HTML.");
    }
}

// Hàm phụ trợ vẽ biểu đồ dạng Sparkline
function drawMarketSparkline(canvasId, item) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Sử dụng dữ liệu mảng nếu API có trả về `history` (ví dụ: [1200, 1220, 1210, 1250])
    // Nếu chưa có, tạo dữ liệu mờ (dummy data) để hiển thị tạm
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
                pointRadius: 0, // Ẩn các chấm tròn để biểu đồ mượt như app chứng khoán
                pointHoverRadius: 4,
                fill: true,
                tension: 0.3 // Làm cong nét vẽ
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
                x: { display: false }, // Ẩn trục X (thời gian) để giao diện gọn gàng
                y: { display: false }  // Ẩn trục Y (chỉ số)
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

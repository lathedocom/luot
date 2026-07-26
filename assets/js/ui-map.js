// FILE: assets/js/ui-map.js

export function renderRiskMap(riskMapData) {
    const mapContainer = document.getElementById('global-risk-map');
    if (!mapContainer || !riskMapData) return;

    // Xóa bản đồ cũ nếu có để tránh bị render đè khi chuyển tab
    mapContainer.innerHTML = '';

    // Trích xuất mảng màu sắc cho jsVectorMap
    const regionColors = {};
    for (const [isoCode, data] of Object.entries(riskMapData)) {
        regionColors[isoCode] = data.color;
    }

    // Khởi tạo jsVectorMap
    new jsVectorMap({
        selector: '#global-risk-map',
        map: 'world',
        zoomOnScroll: true,
        zoomButtons: true,
        backgroundColor: 'transparent',
        
        regionStyle: {
            initial: {
                fill: '#334155', // Màu xám cho quốc gia không có dữ liệu
                fillOpacity: 1,
                stroke: 'none',
                strokeWidth: 0,
                strokeOpacity: 1
            },
            hover: {
                fillOpacity: 0.8,
                cursor: 'pointer'
            }
        },
        
        // Đổ dữ liệu màu vào bản đồ
        series: {
            regions: [{
                attribute: 'fill',
                values: regionColors
            }]
        },

        // Tùy biến Tooltip khi rê chuột
        onRegionTooltipShow(event, tooltip, code) {
            const countryData = riskMapData[code];
            if (countryData) {
                tooltip.text(
                    `<div style="padding: 4px;">
                        <div style="font-weight: bold; margin-bottom: 4px;">${tooltip.text()}</div>
                        <div style="font-size: 12px;">Trạng thái: <span style="color:${countryData.color}">${countryData.status}</span></div>
                        <div style="font-size: 12px;">Điểm rủi ro: ${countryData.score}</div>
                    </div>`,
                    true // true = render dưới dạng HTML
                );
            } else {
                tooltip.text(`${tooltip.text()} (Thiếu dữ liệu)`);
            }
        },

        // Bắt sự kiện Click để hiển thị danh sách sự kiện
        onRegionClick(event, code) {
            const countryData = riskMapData[code];
            if (countryData && countryData.events.length > 0) {
                // Tận dụng UI Modal có sẵn để hiển thị nguyên nhân rủi ro
                const modalTitle = document.getElementById('modal-title');
                const modalBody = document.getElementById('modal-body');
                
                modalTitle.innerHTML = `Chi tiết rủi ro: <span style="color:${countryData.color}">${code}</span>`;
                
                let listHtml = '<ul style="padding-left: 20px; line-height: 1.6;">';
                countryData.events.forEach(evt => {
                    listHtml += `<li><strong>${evt.title}</strong> (Đóng góp: ${evt.score} điểm)</li>`;
                });
                listHtml += '</ul>';

                modalBody.innerHTML = `
                    <div style="background: rgba(0,0,0,0.05); padding: 16px; border-radius: 8px;">
                        <h4 style="margin-bottom: 8px; color: ${countryData.color};">Mức độ: ${countryData.status}</h4>
                        ${listHtml}
                    </div>
                `;

                document.getElementById('intelligence-modal').classList.add('active');
            }
        }
    });
}

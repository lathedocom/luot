// FILE: assets/js/ui-map.js

let mapInstance = null; // Lưu trữ instance của bản đồ
let savedRiskData = null; // Lưu trữ data chờ render

export function renderRiskMap(riskMapData) {
    savedRiskData = riskMapData;
    const mapContainer = document.getElementById('global-risk-map');
    if (!mapContainer || !savedRiskData) return;

    // API THEO DÕI: Canh lúc tab hiện lên (width > 0) thì mới vẽ bản đồ
    const resizeObserver = new ResizeObserver(() => {
        if (mapContainer.offsetWidth > 0) {
            if (!mapInstance) {
                initMap(mapContainer); // Lần đầu mở tab: Khởi tạo bản đồ
            } else {
                mapInstance.updateSize(); // Các lần sau: Chỉ cập nhật kích thước
            }
        }
    });
    
    // Bắt đầu theo dõi thẻ div chứa bản đồ
    resizeObserver.observe(mapContainer);
}

// Hàm khởi tạo bản đồ thực sự
function initMap(mapContainer) {
    mapContainer.innerHTML = ''; // Xóa sạch rác nếu có

    const regionValues = {};
    for (const [isoCode, data] of Object.entries(savedRiskData)) {
        regionValues[isoCode] = data.status;
    }

    mapInstance = new jsVectorMap({
        selector: '#global-risk-map',
        map: 'world',
        zoomOnScroll: true,
        zoomButtons: true,
        backgroundColor: 'transparent',
        
        regionStyle: {
            initial: {
                fill: '#334155', // Màu xám mặc định
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
        
        series: {
            regions: [{
                attribute: 'fill',
                scale: {
                    'Bình thường': '#22c55e',
                    'Đang theo dõi': '#eab308',
                    'Rủi ro cao': '#f97316',
                    'Khủng hoảng nghiêm trọng': '#ef4444'
                },
                values: regionValues
            }]
        },

        onRegionTooltipShow(event, tooltip, code) {
            const countryData = savedRiskData[code];
            if (countryData) {
                tooltip.text(
                    `<div style="padding: 4px;">
                        <div style="font-weight: bold; margin-bottom: 4px;">${tooltip.text()}</div>
                        <div style="font-size: 12px;">Trạng thái: <span style="color:${countryData.color}">${countryData.status}</span></div>
                        <div style="font-size: 12px;">Điểm rủi ro: ${countryData.score}</div>
                    </div>`,
                    true
                );
            } else {
                tooltip.text(`${tooltip.text()} (Thiếu dữ liệu)`);
            }
        },

        onRegionClick(event, code) {
            const countryData = savedRiskData[code];
            if (countryData && countryData.events.length > 0) {
                const modalTitle = document.getElementById('modal-title');
                const modalBody = document.getElementById('modal-body');
                
                const reliabilityContainer = document.getElementById('modal-reliability');
                const miniTimelineContainer = document.getElementById('modal-mini-timeline');
                const toggleBtn = document.getElementById('toggle-sources-btn');
                const sourcesContainer = document.getElementById('modal-sources');
                
                if(reliabilityContainer) reliabilityContainer.innerHTML = '';
                if(miniTimelineContainer) miniTimelineContainer.style.display = 'none';
                if(toggleBtn) toggleBtn.style.display = 'none';
                if(sourcesContainer) sourcesContainer.style.display = 'none';

                modalTitle.innerHTML = `Chi tiết rủi ro: <span style="color:${countryData.color}">${code}</span>`;
                
                let listHtml = '<ul style="padding-left: 20px; line-height: 1.6; font-size: 14px; margin-top: 12px; margin-bottom: 0;">';
                countryData.events.forEach(evt => {
                    listHtml += `<li style="margin-bottom: 8px;"><strong>${evt.title}</strong> <span style="opacity: 0.7;">(+${evt.score} điểm)</span></li>`;
                });
                listHtml += '</ul>';

                modalBody.innerHTML = `
                    <div style="background: rgba(0,0,0,0.05); border-left: 4px solid ${countryData.color}; padding: 16px; border-radius: 4px;">
                        <h4 style="margin: 0; color: ${countryData.color}; font-size: 15px;">Mức độ: ${countryData.status}</h4>
                        ${listHtml}
                    </div>
                `;

                document.getElementById('intelligence-modal').classList.add('active');
            }
        }
    });
}

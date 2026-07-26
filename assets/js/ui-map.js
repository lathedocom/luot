// FILE: assets/js/ui-map.js

let mapInstance = null;
let savedRiskData = null;

export function renderRiskMap(riskMapData) {
    savedRiskData = riskMapData;
    const mapContainer = document.getElementById('global-risk-map');
    if (!mapContainer || !savedRiskData) return;

    const resizeObserver = new ResizeObserver(() => {
        if (mapContainer.offsetWidth > 0) {
            if (!mapInstance) {
                initMap(mapContainer); 
            } else {
                mapInstance.updateSize(); 
            }
        }
    });
    
    resizeObserver.observe(mapContainer);
}

function initMap(mapContainer) {
    mapContainer.innerHTML = ''; 

    const regionValues = {};
    for (const [isoCode, data] of Object.entries(savedRiskData)) {
        regionValues[isoCode] = data.status;
    }

    mapInstance = new jsVectorMap({
        selector: '#global-risk-map',
        map: 'world',
        zoomOnScroll: true,
        zoomButtons: true,
        draggable: true, 
        backgroundColor: 'transparent',
        
        regionStyle: {
            initial: {
                fill: '#334155',
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

        // ====================================================================
        // [CẬP NHẬT] XỬ LÝ CLICK: THÊM NÚT NHẢY SANG KNOWLEDGE GRAPH
        // ====================================================================
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

                // Bổ sung nút liên kết bên dưới danh sách rủi ro
                modalBody.innerHTML = `
                    <div style="background: rgba(0,0,0,0.05); border-left: 4px solid ${countryData.color}; padding: 16px; border-radius: 4px; margin-bottom: 16px;">
                        <h4 style="margin: 0; color: ${countryData.color}; font-size: 15px;">Mức độ: ${countryData.status}</h4>
                        ${listHtml}
                    </div>
                    <button id="jump-to-graph-btn" style="width: 100%; padding: 12px; background-color: var(--md-sys-color-primary, #8b5cf6); color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <span class="material-icons-round" style="font-size: 18px;">hub</span>
                        Phân tích Mạng lưới tri thức
                    </button>
                `;

                document.getElementById('intelligence-modal').classList.add('active');

                // Lắng nghe sự kiện click cho nút vừa tạo
                const jumpBtn = document.getElementById('jump-to-graph-btn');
                if (jumpBtn) {
                    jumpBtn.addEventListener('click', () => {
                        // 1. Đóng Modal hiện tại
                        document.getElementById('intelligence-modal').classList.remove('active');
                        
                        // 2. Kích hoạt tự động bấm vào Tab Knowledge Graph
                        const navKnowledge = document.getElementById('nav-knowledge');
                        if (navKnowledge) {
                            navKnowledge.click();
                        }
                    });
                }
            }
        }
    });
}

// FILE: assets/js/ui-map.js

let mapInstance = null;
let savedRiskData = null;
let currentMapLayer = 'total'; // [MỚI] Biến lưu trữ layer hiện tại

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
    
    // [MỚI] Hàm lấy text trạng thái để map hiểu
    const getStatusByScore = (score) => {
        const volatility = Math.abs(score);
        if (volatility > 8) return 'Diễn biến nghiêm trọng';
        if (volatility > 5) return 'Diễn biến phức tạp';
        if (volatility > 2) return 'Cần theo dõi';
        return 'Ổn định';
    };

    // Hàm lấy màu sắc cho Tooltip
    const getColorByScore = (score) => {
        const volatility = Math.abs(score);
        if (volatility > 8) return '#ef4444'; // Đỏ 
        if (volatility > 5) return '#f97316'; // Cam 
        if (volatility > 2) return '#eab308'; // Vàng 
        return '#22c55e'; // Xanh 
    };

    // [ĐÃ SỬA] Trả về String trạng thái thay vì mã màu HEX
    for (const [isoCode, data] of Object.entries(savedRiskData)) {
        if (data.layers) {
            const layerScore = data.layers[currentMapLayer] || 0;
            regionValues[isoCode.toUpperCase()] = getStatusByScore(layerScore);
        } else {
            regionValues[isoCode.toUpperCase()] = data.status || 'Ổn định';
        }
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
        
        // [ĐÃ SỬA] Bổ sung lại thuộc tính scale để Map có thể ánh xạ màu
        series: {
            regions: [{
                attribute: 'fill',
                scale: {
                    'Ổn định': '#22c55e',
                    'Cần theo dõi': '#eab308',
                    'Diễn biến phức tạp': '#f97316',
                    'Diễn biến nghiêm trọng': '#ef4444',
                    // Fallback
                    'Bình thường': '#22c55e',
                    'Đang theo dõi': '#eab308',
                    'Rủi ro cao': '#f97316',
                    'Khủng hoảng nghiêm trọng': '#ef4444'
                },
                values: regionValues 
            }]
        },
        
        series: {
            regions: [{
                attribute: 'fill',
                values: regionValues // [SỬA] Dùng giá trị HEX màu trực tiếp thay vì scale text
            }]
        },

       onRegionTooltipShow(event, tooltip, code) {
            const countryData = savedRiskData[code];
            
            const translator = new Intl.DisplayNames(['vi'], { type: 'region' });
            let viName = tooltip.text();
            try {
                viName = translator.of(code) || tooltip.text();
            } catch (e) {
                // Bỏ qua lỗi
            }

            if (countryData) {
                // [MỚI] Render tooltip theo chuẩn Situation Index
                const displayScore = countryData.layers ? countryData.layers[currentMapLayer].toFixed(2) : (countryData.si_score || countryData.score);
                const statusColor = getColorByScore(displayScore);
                let statusText = countryData.status || 'Ổn định';
                
                if (countryData.layers) {
                    const vol = Math.abs(displayScore);
                    if (vol > 8) statusText = 'Diễn biến nghiêm trọng';
                    else if (vol > 5) statusText = 'Diễn biến phức tạp';
                    else if (vol > 2) statusText = 'Cần theo dõi';
                    else statusText = 'Ổn định';
                }

                tooltip.html(
                    `<div style="padding: 4px;">
                        <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${viName}</div>
                        <div style="font-size: 12px; margin-bottom: 4px;">Trạng thái: <span style="color:${statusColor}">${statusText}</span></div>
                        <div style="font-size: 12px; margin-bottom: 2px;">Chỉ số biến động (SI): <span style="font-weight:bold; color:${statusColor}">${Math.abs(displayScore)}</span></div>
                        <div style="font-size: 11px; color: #a1a1aa; margin-top: 6px; font-style: italic;">Nhấn để xem các sự kiện tác động</div>
                    </div>`
                );
            } else {
                tooltip.html(`<div style="padding: 4px;">${viName} <br><span style="font-size: 11px; opacity: 0.7;">(Chưa có sự kiện nổi bật)</span></div>`);
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

                const displayScore = countryData.layers ? countryData.layers[currentMapLayer].toFixed(2) : countryData.si_score;
                const statusColor = getColorByScore(displayScore);

                modalTitle.innerHTML = `Tình hình khu vực: <span style="color:${statusColor}">${code}</span>`;
                
                // [MỚI] Chia nhánh sự kiện Tích cực / Tiêu cực
                let posHtml = '', negHtml = '';
                countryData.events.forEach(evt => {
                    const absScore = Math.abs(evt.score);
                    const sentiment = evt.sentiment !== undefined ? evt.sentiment : -1; // Fallback
                    
                    if (sentiment > 0) {
                        posHtml += `<li style="margin-bottom: 6px; color: #10b981;"><strong>${evt.title}</strong> <span style="opacity: 0.7; font-size: 12px;">(SI: ${absScore})</span></li>`;
                    } else {
                        negHtml += `<li style="margin-bottom: 6px; color: #ef4444;"><strong>${evt.title}</strong> <span style="opacity: 0.7; font-size: 12px;">(SI: ${absScore})</span></li>`;
                    }
                });

                let contentHtml = '';
                if (negHtml) contentHtml += `<div style="background: rgba(239, 68, 68, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #ef4444;"><h4 style="margin:0 0 8px; color:#ef4444; font-size: 14px;">🔴 Căng thẳng / Bất ổn</h4><ul style="margin:0; padding-left:16px; font-size:14px;">${negHtml}</ul></div>`;
                if (posHtml) contentHtml += `<div style="background: rgba(16, 185, 129, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #10b981;"><h4 style="margin:0 0 8px; color:#10b981; font-size: 14px;">🟢 Cải thiện / Ổn định</h4><ul style="margin:0; padding-left:16px; font-size:14px;">${posHtml}</ul></div>`;

                modalBody.innerHTML = `
                    <div style="margin-bottom: 16px; font-size: 15px; font-weight: 500;">Chỉ số hiện tại: <span style="color: ${statusColor};">${Math.abs(displayScore)}</span></div>
                    ${contentHtml}
                    <button id="jump-to-graph-btn" style="width: 100%; padding: 12px; background-color: var(--md-sys-color-primary, #8b5cf6); color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-top: 20px;">
                        <span class="material-icons-round" style="font-size: 18px;">hub</span>
                        Phân tích Mạng lưới tri thức
                    </button>
                `;

                document.getElementById('intelligence-modal').classList.add('active');

                const jumpBtn = document.getElementById('jump-to-graph-btn');
                if (jumpBtn) {
                    jumpBtn.addEventListener('click', () => {
                        document.getElementById('intelligence-modal').classList.remove('active');
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

// [MỚI] Lắng nghe sự kiện chuyển đổi Layer bản đồ
document.addEventListener('DOMContentLoaded', () => {
    const filterSelect = document.getElementById('map-layer-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            currentMapLayer = e.target.value;
            const mapContainer = document.getElementById('global-risk-map');
            if (mapContainer && savedRiskData) {
                initMap(mapContainer);
            }
        });
    }
});


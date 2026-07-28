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
        regionValues[isoCode] = data.status; // Tạm giữ nguyên cách map cũ lấy màu, có thể bạn sẽ cần sửa logic fill map này sau nếu object data đổi cấu trúc
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
            const translator = new Intl.DisplayNames(['vi'], { type: 'region' });
            let viName = tooltip.text();
            try { viName = translator.of(code) || tooltip.text(); } catch (e) {}
            
            if (countryData) {
                // Sử dụng GSI và Trend mới
                tooltip.text(
                    `<div style="padding: 4px;">
                        <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${viName} ${countryData.trend_icon}</div>
                        <div style="font-size: 12px;">Tình trạng: <span style="font-weight:bold; color:${countryData.level === 'red' ? '#ef4444' : countryData.level === 'orange' ? '#f97316' : countryData.level === 'yellow' ? '#eab308' : '#22c55e'}">${countryData.label}</span></div>
                        <div style="font-size: 12px;">GSI Score: ${countryData.gsi} / 10</div>
                    </div>`,
                    true
                );
            } else {
                tooltip.text(`${viName} (Ổn định)`);
            }
        },
        
        onRegionClick(event, code) {
            const countryData = savedRiskData[code];
            if (countryData && countryData.explanation && countryData.explanation.top_events.length > 0) {
                const modalTitle = document.getElementById('modal-title');
                const modalBody = document.getElementById('modal-body');
                
                modalTitle.innerHTML = `Biến động tại: <span style="text-transform: uppercase;">${code}</span> ${countryData.trend_icon}`;
                
                let listHtml = '<div style="margin-top: 12px; display: flex; flex-direction: column; gap: 12px;">';
                countryData.explanation.top_events.forEach(evt => {
                    listHtml += `
                    <div style="padding-bottom: 12px; border-bottom: 1px dashed var(--md-sys-color-outline);">
                        <strong style="font-size:15px; color: var(--md-sys-color-on-surface)">${evt.title}</strong>
                        <span style="font-size: 12px; padding: 2px 6px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 4px; margin-left: 6px;">Cấp độ: ${evt.severity}</span>
                        <p style="font-size: 13px; opacity: 0.8; margin: 4px 0 0 0; line-height: 1.5;">${evt.summary}</p>
                    </div>`;
                });
                listHtml += '</div>';

                modalBody.innerHTML = `
                    <div style="background: rgba(0,0,0,0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                        <h4 style="margin: 0 0 8px 0; color: var(--md-sys-color-primary); font-size: 15px;">Tổng quan từ AI</h4>
                        <p style="margin: 0; font-size: 14px; line-height: 1.5;">${countryData.explanation.narrative}</p>
                    </div>
                    <div style="font-weight: bold; font-size: 14px; text-transform: uppercase; color: var(--md-sys-color-on-surface); opacity: 0.7;">Các sự kiện châm ngòi</div>
                    ${listHtml}
                `;
                document.getElementById('intelligence-modal').classList.add('active');
            }
        }
    });
}

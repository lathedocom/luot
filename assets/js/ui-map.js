// FILE: assets/js/ui-map.js

let mapInstance = null;
let savedRiskData = null;
let currentMapLayer = 'total';

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
    
    // 1. ÁNH XẠ CHUYÊN MỤC (Hỗ trợ cả khóa cũ và mới để tránh lỗi HTML)
    const LAYER_MAPPING = {
        'security': ['politics', 'military', 'diplomacy'],
        'military': ['politics', 'military', 'diplomacy'],
        'economy': ['economy', 'finance', 'business', 'tech'],
        'disaster': ['environment'], 
        'environment': ['environment'], 
        'health': ['health']
    };

    // 2. ÁNH XẠ ID KHU VỰC CỦA AI -> MÃ ISO 2 CHỮ CÁI CỦA JSVECTORMAP
    const REGION_TO_ISO = {
        'vietnam': ['VN'],
        'usa': ['US'],
        'canada': ['CA'],
        'china': ['CN'],
        'russia_ukraine': ['RU', 'UA'], 
        'eu': ['FR', 'DE', 'IT', 'ES', 'PL', 'SE', 'NL', 'BE', 'AT', 'FI'], 
        'asean': ['TH', 'ID', 'MY', 'SG', 'PH', 'KH', 'LA', 'MM', 'BN'],
        'asia': ['JP', 'KR', 'IN', 'PK', 'BD', 'TW'],
        'middle_east': ['IL', 'IR', 'PS', 'SY', 'LB', 'SA', 'AE', 'QA', 'IQ', 'YE'],
        'oceania': ['AU', 'NZ'],
        'latin_america': ['BR', 'AR', 'MX', 'VE', 'CO', 'CL', 'PE'],
        'africa': ['ZA', 'EG', 'NG', 'KE', 'GH', 'ET'],
        'global': [] 
    };

    const getScaleKey = (score) => {
        const volatility = Math.abs(score);
        if (volatility > 8) return 'L4'; 
        if (volatility > 5) return 'L3'; 
        if (volatility > 2) return 'L2'; 
        return 'L1'; 
    };

    const getColorByScore = (score) => {
        const volatility = Math.abs(score);
        if (volatility > 8) return '#ef4444'; 
        if (volatility > 5) return '#f97316'; 
        if (volatility > 2) return '#eab308'; 
        return '#22c55e'; 
    };

    // XỬ LÝ LẠI VÒNG LẶP DỮ LIỆU ĐỂ GÁN CHO NHIỀU QUỐC GIA
    for (const [regionId, data] of Object.entries(savedRiskData)) {
        let isoCodes = REGION_TO_ISO[regionId.toLowerCase()] || [regionId.toUpperCase()];

        isoCodes.forEach(isoCode => {
            let displayScore = 0;

            if (currentMapLayer === 'total') {
                displayScore = data.si_score || data.score || 0;
            } else if (data.layers) {
                const targetCategories = LAYER_MAPPING[currentMapLayer] || [];
                targetCategories.forEach(cat => {
                    displayScore += (data.layers[cat] || 0);
                });
            }

            if (displayScore !== 0) {
                regionValues[isoCode] = getScaleKey(displayScore);
                
                if (!data.filtered_score) data.filtered_score = {};
                data.filtered_score[isoCode] = displayScore;
            }
        });
    }

    mapInstance = new jsVectorMap({
        selector: '#global-risk-map',
        map: 'world',
        zoomOnScroll: true,
        zoomButtons: true,
        draggable: true, 
        backgroundColor: 'transparent',
        
        regionStyle: {
            initial: { fill: '#334155', fillOpacity: 1, stroke: 'none', strokeWidth: 0, strokeOpacity: 1 },
            hover: { fillOpacity: 0.8, cursor: 'pointer' }
        },
        
        series: {
            regions: [{
                attribute: 'fill',
                scale: {
                    'L1': '#22c55e',
                    'L2': '#eab308',
                    'L3': '#f97316',
                    'L4': '#ef4444'
                },
                values: regionValues 
            }]
        },
        
        onRegionTooltipShow(event, tooltip, code) {
            let targetRegionId = Object.keys(REGION_TO_ISO).find(key => REGION_TO_ISO[key].includes(code)) || code.toLowerCase();
            
            // [QUAN TRỌNG]: Quét tìm dữ liệu bằng mọi khóa có thể để chống trượt
            const countryData = savedRiskData[targetRegionId] || 
                                savedRiskData[code] || 
                                savedRiskData[code.toLowerCase()] || 
                                savedRiskData[code.toUpperCase()];
            
            const translator = new Intl.DisplayNames(['vi'], { type: 'region' });
            let viName = tooltip.text();
            try { viName = translator.of(code) || tooltip.text(); } catch (e) {}

            if (countryData) {
                const displayScore = (countryData.filtered_score && countryData.filtered_score[code]) 
                                     ? countryData.filtered_score[code].toFixed(2) 
                                     : (countryData.si_score || countryData.score || 0);
                
                if (displayScore == 0 && currentMapLayer !== 'total') {
                    // Cấp quyền render HTML bằng tham số true
                    tooltip.text(`<div style="padding: 4px;">${viName} <br><span style="font-size: 11px; opacity: 0.7;">(Không có sự kiện cho lớp này)</span></div>`, true);
                    return;
                }

                const statusColor = getColorByScore(displayScore);
                const vol = Math.abs(displayScore);
                let statusText = 'Ổn định';
                if (vol > 8) statusText = 'Diễn biến nghiêm trọng';
                else if (vol > 5) statusText = 'Diễn biến phức tạp';
                else if (vol > 2) statusText = 'Cần theo dõi';
                
                tooltip.text(
                    `<div style="padding: 4px;">
                        <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${viName}</div>
                        <div style="font-size: 12px; margin-bottom: 4px;">Trạng thái: <span style="color:${statusColor}">${statusText}</span></div>
                        <div style="font-size: 12px; margin-bottom: 2px;">Chỉ số biến động (SI): <span style="font-weight:bold; color:${statusColor}">${Math.abs(displayScore)}</span></div>
                        <div style="font-size: 11px; color: #a1a1aa; margin-top: 6px; font-style: italic;">Nhấn để xem các sự kiện tác động</div>
                    </div>`,
                    true
                );
            } else {
                tooltip.text(`<div style="padding: 4px;">${viName} <br><span style="font-size: 11px; opacity: 0.7;">(Chưa có sự kiện nổi bật)</span></div>`, true);
            }
        },

        onRegionClick(event, code) {
            let targetRegionId = Object.keys(REGION_TO_ISO).find(key => REGION_TO_ISO[key].includes(code)) || code.toLowerCase();
            
            // [QUAN TRỌNG]: Backup tìm dữ liệu bằng mã ISO chuẩn nếu không khớp Region ID
            const countryData = savedRiskData[targetRegionId] || 
                                savedRiskData[code] || 
                                savedRiskData[code.toLowerCase()] || 
                                savedRiskData[code.toUpperCase()];
            
            if (countryData && countryData.events && countryData.events.length > 0) {
                const modalTitle = document.getElementById('modal-title');
                const modalBody = document.getElementById('modal-body');
                
                const displayScore = (countryData.filtered_score && countryData.filtered_score[code]) 
                                     ? countryData.filtered_score[code].toFixed(2) 
                                     : (countryData.si_score || countryData.score || 0);
                const statusColor = getColorByScore(displayScore);
                
                document.getElementById('modal-reliability').innerHTML = '';
                document.getElementById('modal-mini-timeline').style.display = 'none';
                document.getElementById('toggle-sources-btn').style.display = 'none';
                document.getElementById('modal-sources').style.display = 'none';
                
                const translator = new Intl.DisplayNames(['vi'], { type: 'region' });
                let viName = code;
                try { viName = translator.of(code) || code; } catch (e) {}

                modalTitle.innerHTML = `Tình hình khu vực: <span style="color:${statusColor}">${viName}</span>`;
                
                let posHtml = '', negHtml = '';
                countryData.events.forEach(evt => {
                    if (currentMapLayer !== 'total' && evt.categories) {
                        const targetCategories = LAYER_MAPPING[currentMapLayer] || [];
                        const isMatch = evt.categories.some(c => targetCategories.includes(c));
                        if (!isMatch) return; 
                    }

                    const absScore = Math.abs(evt.score);
                    const sentiment = evt.sentiment !== undefined ? evt.sentiment : -1; 
                    
                    if (sentiment > 0) {
                        posHtml += `<li style="margin-bottom: 6px; color: #10b981;"><strong>${evt.title}</strong> <span style="opacity: 0.7; font-size: 12px;">(SI: ${absScore})</span></li>`;
                    } else {
                        negHtml += `<li style="margin-bottom: 6px; color: #ef4444;"><strong>${evt.title}</strong> <span style="opacity: 0.7; font-size: 12px;">(SI: ${absScore})</span></li>`;
                    }
                });
                
                let contentHtml = '';
                if (negHtml) contentHtml += `<div style="background: rgba(239, 68, 68, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #ef4444;"><h4 style="margin:0 0 8px; color:#ef4444; font-size: 14px;">🔴 Căng thẳng / Bất ổn</h4><ul style="margin:0; padding-left:16px; font-size:14px;">${negHtml}</ul></div>`;
                if (posHtml) contentHtml += `<div style="background: rgba(16, 185, 129, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #10b981;"><h4 style="margin:0 0 8px; color:#10b981; font-size: 14px;">🟢 Cải thiện / Ổn định</h4><ul style="margin:0; padding-left:16px; font-size:14px;">${posHtml}</ul></div>`;
                
                if (!contentHtml) contentHtml = '<p style="font-size: 14px; opacity: 0.7;">Không có sự kiện nào khớp với bộ lọc hiện tại.</p>';

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
                        if (navKnowledge) navKnowledge.click();
                    });
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const filterSelect = document.getElementById('map-layer-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            currentMapLayer = e.target.value;
            const mapContainer = document.getElementById('global-risk-map');
            if (mapContainer && savedRiskData) initMap(mapContainer);
        });
    }
});

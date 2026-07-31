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
    
    // 1. ÁNH XẠ CHUYÊN MỤC 
    const LAYER_MAPPING = {
        'security': ['politics', 'military', 'diplomacy'],
        'military': ['politics', 'military', 'diplomacy'],
        'economy': ['economy', 'finance', 'business', 'tech'],
        'disaster': ['environment'], 
        'environment': ['environment'], 
        'health': ['health']
    };

    // 2. ÁNH XẠ KHU VỰC CŨ -> MÃ ISO 
    const REGION_TO_ISO = {
        'vietnam': ['VN'], 'usa': ['US'], 'canada': ['CA'], 'china': ['CN'],
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

    // =========================================================
    // [BƯỚC ĐỘT PHÁ] CHUẨN HÓA VÀ TỰ ĐỘNG TÍNH ĐIỂM THEO MÃ ISO
    // =========================================================
    const processedIsoData = {};

    for (const [regionId, data] of Object.entries(savedRiskData)) {
        let isoCodes = REGION_TO_ISO[regionId.toLowerCase()] || [regionId.toUpperCase()];

        isoCodes.forEach(iso => {
            if (!processedIsoData[iso]) {
                processedIsoData[iso] = { events: [], filtered_score: 0 };
            }

            // Gộp danh sách sự kiện
            if (data.events && Array.isArray(data.events)) {
                processedIsoData[iso].events.push(...data.events);
            }
        });
    }

    // Tự động tính toán điểm số (Score) cho từng lớp chuyên mục dựa trên danh sách sự kiện
    for (const iso in processedIsoData) {
        let layerScore = 0;
        const targetCategories = LAYER_MAPPING[currentMapLayer] || [];

        processedIsoData[iso].events.forEach(evt => {
            // Kiểm tra xem sự kiện có thuộc Lớp bản đồ đang chọn không
            const isMatch = (currentMapLayer === 'total') || (evt.categories && evt.categories.some(c => targetCategories.includes(c)));
            
            if (isMatch) {
                // Tính điểm chuẩn: Ưu tiên dùng 'score', dự phòng bằng 'value_score' hoặc 'severity'
                let eventScore = evt.score;
                if (eventScore === undefined || isNaN(eventScore)) {
                    let base = evt.value_score ? (evt.value_score / 10) : (evt.severity ? evt.severity * 2 : 5);
                    let sens = evt.sentiment !== undefined ? evt.sentiment : -1;
                    if (sens === 0) sens = 1;
                    eventScore = base * sens;
                }
                layerScore += eventScore;
            }
        });

        processedIsoData[iso].filtered_score = layerScore;

        // Bôi màu bản đồ nếu điểm khác 0
        if (layerScore !== 0) {
            regionValues[iso] = getScaleKey(layerScore);
        }
    }

    // KHỞI TẠO BẢN ĐỒ
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
            const countryData = processedIsoData[code];
            const translator = new Intl.DisplayNames(['vi'], { type: 'region' });
            let viName = tooltip.text();
            try { viName = translator.of(code) || tooltip.text(); } catch (e) {}

            if (countryData && countryData.filtered_score !== 0) {
                const displayScore = countryData.filtered_score;
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
                        <div style="font-size: 12px; margin-bottom: 2px;">Chỉ số biến động (SI): <span style="font-weight:bold; color:${statusColor}">${Math.abs(displayScore).toFixed(1)}</span></div>
                        <div style="font-size: 11px; color: #a1a1aa; margin-top: 6px; font-style: italic;">Nhấn để xem các sự kiện tác động</div>
                    </div>`,
                    true
                );
            } else {
                tooltip.text(`<div style="padding: 4px;">${viName} <br><span style="font-size: 11px; opacity: 0.7;">(Không có sự kiện nổi bật cho lớp này)</span></div>`, true);
            }
        },

        onRegionClick(event, code) {
            const countryData = processedIsoData[code];
            
            if (countryData && countryData.events && countryData.events.length > 0) {
                // Lọc sự kiện hiển thị theo lớp bản đồ hiện tại
                let displayEvents = countryData.events;
                if (currentMapLayer !== 'total') {
                    const targetCats = LAYER_MAPPING[currentMapLayer] || [];
                    displayEvents = displayEvents.filter(evt => evt.categories && evt.categories.some(c => targetCats.includes(c)));
                }

                if (displayEvents.length === 0) return; // Nếu không có sự kiện nào khớp bộ lọc thì không mở Modal

                const modalTitle = document.getElementById('modal-title');
                const modalBody = document.getElementById('modal-body');
                
                const displayScore = countryData.filtered_score;
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
                displayEvents.forEach(evt => {
                    let absScore = Math.abs(evt.score);
                    // Tự tính lại điểm nếu bị thiếu
                    if (isNaN(absScore) || absScore === 0) {
                        absScore = evt.value_score ? (evt.value_score / 10) : (evt.severity ? evt.severity * 2 : 5);
                    }

                    const sentiment = evt.sentiment !== undefined ? evt.sentiment : -1; 
                    
                    if (sentiment > 0) {
                        posHtml += `<li style="margin-bottom: 6px; color: #10b981;"><strong>${evt.title}</strong> <span style="opacity: 0.7; font-size: 12px;">(SI: ${absScore.toFixed(1)})</span></li>`;
                    } else {
                        negHtml += `<li style="margin-bottom: 6px; color: #ef4444;"><strong>${evt.title}</strong> <span style="opacity: 0.7; font-size: 12px;">(SI: ${absScore.toFixed(1)})</span></li>`;
                    }
                });
                
                let contentHtml = '';
                if (negHtml) contentHtml += `<div style="background: rgba(239, 68, 68, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #ef4444;"><h4 style="margin:0 0 8px; color:#ef4444; font-size: 14px;">🔴 Căng thẳng / Bất ổn</h4><ul style="margin:0; padding-left:16px; font-size:14px;">${negHtml}</ul></div>`;
                if (posHtml) contentHtml += `<div style="background: rgba(16, 185, 129, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #10b981;"><h4 style="margin:0 0 8px; color:#10b981; font-size: 14px;">🟢 Cải thiện / Ổn định</h4><ul style="margin:0; padding-left:16px; font-size:14px;">${posHtml}</ul></div>`;

                modalBody.innerHTML = `
                    <div style="margin-bottom: 16px; font-size: 15px; font-weight: 500;">Chỉ số hiện tại: <span style="color: ${statusColor};">${Math.abs(displayScore).toFixed(1)}</span></div>
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

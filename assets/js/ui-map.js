// FILE: assets/js/ui-map.js

let mapInstance = null;
let savedRiskData = null;
let currentMapLayer = 'total';

// Hàm này được gọi từ file chính (ví dụ ui-news.js) truyền dữ liệu db.risk_map vào
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

// [SỬA] Hàm này chuyển tên layer hiển thị (HTML) sang tên layer backend dùng.
// Tách thành hàm dùng chung vì giờ cần dùng ở NHIỀU nơi (tô màu, tooltip, modal), trước đây chỉ có ở initMap.
function toBackendLayer(uiLayer) {
    if (uiLayer === 'military') return 'security';
    if (uiLayer === 'environment') return 'disaster';
    return uiLayer;
}

// [SỬA] Tô màu/xếp mức độ dựa theo GIÁ TRỊ CÓ DẤU thay vì trị tuyệt đối.
// Lý do: trước đây dùng Math.abs(score) nên một khu vực có nhiều TIN TỐT dồn dập (điểm dương lớn)
// vẫn bị xếp cùng mức với khủng hoảng thật (điểm âm lớn) -> bị tô đỏ "nghiêm trọng" oan uổng.
// Giờ: âm lớn = báo động thật (vàng/cam/đỏ), dương lớn = diễn biến tích cực (xanh dương),
// quanh 0 = ổn định (xanh lá).
function getScaleKey(score) {
    if (score <= -8) return 'L4';
    if (score <= -5) return 'L3';
    if (score <= -2) return 'L2';
    if (score >= 8) return 'P2';
    if (score >= 2) return 'P1';
    return 'L1';
}

function getColorByScore(score) {
    if (score <= -8) return '#ef4444';
    if (score <= -5) return '#f97316';
    if (score <= -2) return '#eab308';
    if (score >= 8) return '#0ea5e9';
    if (score >= 2) return '#22c55e';
    return '#22c55e';
}

function getStatusTextByScore(score) {
    if (score <= -8) return 'Diễn biến nghiêm trọng';
    if (score <= -5) return 'Diễn biến phức tạp';
    if (score <= -2) return 'Cần theo dõi';
    if (score >= 8) return 'Tiến triển vượt bậc';
    if (score >= 2) return 'Diễn biến tích cực';
    return 'Ổn định';
}

function initMap(mapContainer) {
    mapContainer.innerHTML = '';
    const regionValues = {};

    // =========================================================
    // ĐỌC DỮ LIỆU ĐÃ TÍNH SẴN TỪ BACKEND
    // =========================================================
    for (const [isoCode, data] of Object.entries(savedRiskData)) {
        let layerScore = 0;

        const backendLayer = toBackendLayer(currentMapLayer);

        // Trích xuất điểm theo lớp
        if (data.layers && data.layers[backendLayer] !== undefined) {
            layerScore = data.layers[backendLayer];
        } else if (currentMapLayer === 'total') {
            layerScore = data.si_score || 0;
        }

        // Chỉ tô màu những khu vực có biến động
        if (Math.abs(layerScore) > 0.1) {
            regionValues[isoCode] = getScaleKey(layerScore);
        }
    }

    // =========================================================
    // KHỞI TẠO BẢN ĐỒ BẰNG JSVECTORMAP
    // =========================================================
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
                    // Mức báo động (điểm âm - tình hình xấu đi)
                    'L1': '#22c55e', // Ổn định / gần như không biến động
                    'L2': '#eab308', // Cần theo dõi
                    'L3': '#f97316', // Diễn biến phức tạp
                    'L4': '#ef4444', // Diễn biến nghiêm trọng
                    // [MỚI] Mức tích cực (điểm dương - tình hình tốt lên), KHÔNG dùng màu báo động
                    'P1': '#22c55e', // Diễn biến tích cực
                    'P2': '#0ea5e9'  // Tiến triển vượt bậc
                },
                values: regionValues
            }]
        },

        onRegionTooltipShow(event, tooltip, code) {
            const countryData = savedRiskData[code];
            const translator = new Intl.DisplayNames(['vi'], { type: 'region' });
            let viName = tooltip.text();
            try { viName = translator.of(code) || tooltip.text(); } catch (e) {}

            const backendLayer = toBackendLayer(currentMapLayer);
            let layerScore = 0;
            if (countryData && countryData.layers) {
                layerScore = countryData.layers[backendLayer] || 0;
                if (currentMapLayer === 'total') layerScore = countryData.si_score || 0;
            }

            if (countryData && Math.abs(layerScore) > 0.1) {
                const displayScore = layerScore;
                const statusColor = getColorByScore(displayScore);
                const statusText = getStatusTextByScore(displayScore);

                tooltip.text(
                    `<div style="padding: 4px;">
                        <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${viName}</div>
                        <div style="font-size: 12px; margin-bottom: 4px;">Trạng thái: <span style="color:${statusColor}">${statusText}</span></div>
                        <div style="font-size: 12px; margin-bottom: 2px;">Chỉ số rủi ro (SI): <span style="font-weight:bold; color:${statusColor}">${Math.abs(displayScore).toFixed(1)}</span></div>
                        <div style="font-size: 11px; color: #a1a1aa; margin-top: 6px; font-style: italic;">Nhấn để xem chi tiết sự kiện</div>
                    </div>`,
                    true
                );
            } else {
                tooltip.text(`<div style="padding: 4px;">${viName} <br><span style="font-size: 11px; opacity: 0.7;">(Không có sự kiện nổi bật)</span></div>`, true);
            }
        },

        onRegionClick(event, code) {
            const countryData = savedRiskData[code];
            if (!countryData || !countryData.events || countryData.events.length === 0) return;

            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');

            const backendLayer = toBackendLayer(currentMapLayer);

            // [SỬA] Lọc sự kiện theo đúng lớp (layer) đang được chọn trên bộ lọc.
            // Trước đây luôn hiển thị TẤT CẢ sự kiện (top5 tổng, trộn mọi layer) bất kể người dùng
            // đang xem "Toàn cảnh", "Kinh tế" hay "Quân sự" — vì dữ liệu event thiếu field "layer"
            // (đã bổ sung lại ở backend). Giờ nếu KHÔNG phải 'total' thì chỉ lấy event đúng layer đó.
            const filteredEvents = (currentMapLayer === 'total')
                ? countryData.events
                : countryData.events.filter(e => e.layer === backendLayer);

            if (filteredEvents.length === 0) return; // Không có sự kiện nào thuộc lớp đang chọn -> không mở modal

            let layerScore = (currentMapLayer === 'total')
                ? (countryData.si_score || 0)
                : (countryData.layers ? (countryData.layers[backendLayer] || 0) : 0);

            const displayScore = layerScore;
            const statusColor = getColorByScore(displayScore);

            // Xóa rác dữ liệu từ các lần mở Modal khác
            const elRel = document.getElementById('modal-reliability');
            const elMiniTl = document.getElementById('modal-mini-timeline');
            const elToggleSrc = document.getElementById('toggle-sources-btn');
            const elSources = document.getElementById('modal-sources');
            if (elRel) elRel.innerHTML = '';
            if (elMiniTl) elMiniTl.style.display = 'none';
            if (elToggleSrc) elToggleSrc.style.display = 'none';
            if (elSources) elSources.style.display = 'none';

            const translator = new Intl.DisplayNames(['vi'], { type: 'region' });
            let viName = code;
            try { viName = translator.of(code) || code; } catch (e) {}

            // [MỚI] Hiện rõ đang xem theo lăng kính (lớp) nào trong tiêu đề modal, tránh gây hiểu lầm
            const layerLabelMap = {
                total: 'Toàn cảnh', security: 'Quân sự', economy: 'Kinh tế',
                disaster: 'Môi trường', health: 'Y tế', general: 'Khác'
            };
            const layerLabel = layerLabelMap[backendLayer] || 'Toàn cảnh';

            if (modalTitle) modalTitle.innerHTML = `Tình hình khu vực: <span style="color:${statusColor}">${viName}</span> <span style="font-size:12px; opacity:0.7; font-weight:normal;">(${layerLabel})</span>`;

            let posHtml = '', negHtml = '', neutralHtml = '';

            // Lặp qua các sự kiện đã được Backend lọc sẵn (và giờ đã lọc thêm theo layer ở trên)
            filteredEvents.forEach(evt => {
                let absScore = Math.abs(evt.score);
                // [SỬA] Thêm nhánh trung lập rõ ràng thay vì gộp chung vào "tiêu cực".
                // Trước đây bất kỳ event nào có sentiment không dương (kể cả 0/không rõ) đều bị coi là tiêu cực,
                // khiến tin trung lập/chưa phân loại bị hiện nhầm trong mục "🔴 Căng thẳng/Bất ổn".
                if (evt.sentiment > 0) {
                    posHtml += `<li style="margin-bottom: 6px; color: #10b981;"><strong>${evt.title}</strong> <span style="opacity: 0.7; font-size: 12px;">(SI: ${absScore.toFixed(1)})</span></li>`;
                } else if (evt.sentiment < 0) {
                    negHtml += `<li style="margin-bottom: 6px; color: #ef4444;"><strong>${evt.title}</strong> <span style="opacity: 0.7; font-size: 12px;">(SI: ${absScore.toFixed(1)})</span></li>`;
                } else {
                    neutralHtml += `<li style="margin-bottom: 6px; color: #94a3b8;"><strong>${evt.title}</strong> <span style="opacity: 0.7; font-size: 12px;">(SI: ${absScore.toFixed(1)})</span></li>`;
                }
            });

            let contentHtml = '';
            if (negHtml) contentHtml += `<div style="background: rgba(239, 68, 68, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #ef4444;"><h4 style="margin:0 0 8px; color:#ef4444; font-size: 14px;">🔴 Căng thẳng / Bất ổn</h4><ul style="margin:0; padding-left:16px; font-size:14px;">${negHtml}</ul></div>`;
            if (posHtml) contentHtml += `<div style="background: rgba(16, 185, 129, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #10b981;"><h4 style="margin:0 0 8px; color:#10b981; font-size: 14px;">🟢 Cải thiện / Ổn định</h4><ul style="margin:0; padding-left:16px; font-size:14px;">${posHtml}</ul></div>`;
            if (neutralHtml) contentHtml += `<div style="background: rgba(148, 163, 184, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #94a3b8;"><h4 style="margin:0 0 8px; color:#94a3b8; font-size: 14px;">⚪ Thông tin trung lập / Chưa rõ tác động</h4><ul style="margin:0; padding-left:16px; font-size:14px;">${neutralHtml}</ul></div>`;

            if (modalBody) {
                modalBody.innerHTML = `
                    <div style="margin-bottom: 16px; font-size: 15px; font-weight: 500;">Chỉ số rủi ro: <span style="color: ${statusColor};">${Math.abs(displayScore).toFixed(1)}</span></div>
                    ${contentHtml}
                    <button id="jump-to-graph-btn" style="width: 100%; padding: 12px; background-color: var(--md-sys-color-primary, #8b5cf6); color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-top: 20px;">
                        <span class="material-icons-round" style="font-size: 18px;">hub</span>
                        Phân tích Mạng lưới tri thức
                    </button>
                `;
            }

            const activeModal = document.getElementById('intelligence-modal');
            if (activeModal) activeModal.classList.add('active');

            const jumpBtn = document.getElementById('jump-to-graph-btn');
            if (jumpBtn) {
                jumpBtn.addEventListener('click', () => {
                    if (activeModal) activeModal.classList.remove('active');
                    const navKnowledge = document.getElementById('nav-knowledge');
                    if (navKnowledge) navKnowledge.click();
                });
            }
        }
    });
}

// Bắt sự kiện thay đổi Lớp bản đồ (Filter)
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

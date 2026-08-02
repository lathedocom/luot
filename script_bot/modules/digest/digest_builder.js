// FILE: script_bot/modules/digest/digest_builder.js

function buildDigest(allTopics, { limitPerRegion = 7, windowMs = 48 * 60 * 60 * 1000 } = {}) {
    const now = Date.now();
    const recentTopics = allTopics.filter(t => {
        const topicTime = t.last_updated || t.timestamp || 0;
        return (now - topicTime) <= windowMs;
    });

    const buckets = { vietnam: [], asia: [], global: [] };
    const ASIA_REGIONS = ['china', 'asean', 'asia'];

    recentTopics.forEach(t => {
        const regions = t.regions || [];
        if (regions.includes('vietnam')) {
            buckets.vietnam.push(t);
        } else if (regions.some(r => ASIA_REGIONS.includes(r))) {
            buckets.asia.push(t);
        } else {
            buckets.global.push(t);
        }
    });

    const mapLightweight = (t) => ({
        event_key: t.event_key,
        title: t.title || t.cluster_title,
        short_summary: t.short_summary,
        value_score: t.value_score,
        timestamp: t.timestamp,
        last_updated: t.last_updated,
        update_count: t.update_count,
        regions: t.regions,
        sources_count: (t.sources || []).length
    });

    const topN = (arr) => arr
        .sort((a, b) => (b.value_score || 0) - (a.value_score || 0))
        .slice(0, limitPerRegion)
        .map(mapLightweight);

    return { vietnam: topN(buckets.vietnam), asia: topN(buckets.asia), global: topN(buckets.global), generated_at: Date.now() };
}

// =====================================================================
// SITUATION INDEX ENGINE
// =====================================================================

const REGION_TO_ISO = {
    'vietnam': ['VN'], 'usa': ['US'], 'canada': ['CA'],
    'china': ['CN', 'TW', 'HK'],
    'eu': ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'CH', 'SE', 'PL'],
    'russia_ukraine': ['RU', 'UA', 'BY'],
    'asean': ['SG', 'TH', 'MY', 'ID', 'PH', 'KH', 'LA', 'MM', 'BN'],
    'asia': ['JP', 'KR', 'IN', 'PK', 'BD', 'LK'],
    'middle_east': ['IL', 'PS', 'IR', 'SY', 'LB', 'SA', 'AE', 'QA', 'IQ', 'YE'],
    'oceania': ['AU', 'NZ'],
    'latin_america': ['BR', 'AR', 'MX', 'CO', 'CL', 'PE', 'VE'],
    'africa': ['ZA', 'GH', 'NG', 'EG', 'KE', 'ET'],
    // Gán các tin tức Toàn cầu (Global) tác động lên các cường quốc đại diện
    'global': ['US', 'CN', 'RU', 'GB', 'FR', 'DE', 'JP', 'IN']
};

const CATEGORY_WEIGHTS = { 'military': 2.5, 'health': 2.0, 'disaster': 2.2, 'economy': 1.0, 'politics': 1.4, 'default': 1.0 };
const IMPACT_TO_SEVERITY = { 'crisis': 5, 'risk': 4, 'monitor': 2, 'development': 1 };

// [MỚI] Số lượng sự kiện lưu tối đa cho MỖI quốc gia.
// Tăng từ 5 lên 12 vì giờ cần đủ sự kiện để lọc riêng theo từng layer (kinh tế/quân sự/môi trường/y tế)
// mà vẫn còn dữ liệu để hiển thị, thay vì chỉ giữ top 5 tổng rồi làm mất hết event của layer khác.
const MAX_EVENTS_PER_REGION = 12;
// Số sự kiện hiển thị tối đa trong modal cho MỘT layer cụ thể sau khi lọc (client sẽ tự cắt, nhưng để backend
// trả đủ dữ liệu thô, không cắt cứng ở đây nữa).

function getLayerName(categories) {
    if (!categories || categories.length === 0) return 'general';
    const catStr = categories.join(' ').toLowerCase();
    if (catStr.includes('quân sự') || catStr.includes('xung đột') || catStr.includes('chiến tranh') || catStr.includes('military')) return 'security';
    if (catStr.includes('kinh tế') || catStr.includes('tài chính') || catStr.includes('doanh nghiệp') || catStr.includes('economy')) return 'economy';
    if (catStr.includes('môi trường') || catStr.includes('thiên tai') || catStr.includes('environment')) return 'disaster';
    if (catStr.includes('y tế') || catStr.includes('sức khỏe') || catStr.includes('health')) return 'health';
    return 'general';
}

function buildSituationIndexData(topics, previousData = {}) {
    const regionData = {};
    const now = Date.now();

    topics.forEach(topic => {
        // [SỬA] Dùng last_updated nếu có (tin đang tiếp diễn/được cập nhật) thay vì chỉ dùng timestamp gốc.
        // Lý do: 1 sự kiện xảy ra vài ngày trước nhưng vẫn đang được cập nhật tin mới (ví dụ Nhật xả nước
        // phóng xạ) không nên bị decay về gần 0 chỉ vì timestamp GỐC đã cũ. Việc này trước đây khiến
        // những sự kiện môi trường/khủng hoảng thực sự đang tiếp diễn bị tô XANH (ổn định) sai lệch.
        const referenceTime = topic.last_updated || topic.timestamp || now;
        const daysOld = (now - referenceTime) / (1000 * 60 * 60 * 24);
        const decay = Math.max(0.15, 1 - (daysOld * 0.15));

        const layer = getLayerName(topic.categories);
        let weight = CATEGORY_WEIGHTS['default'];
        if (layer === 'security') weight = CATEGORY_WEIGHTS['military'];
        else if (layer === 'economy') weight = CATEGORY_WEIGHTS['economy'];
        else if (layer === 'disaster') weight = CATEGORY_WEIGHTS['disaster'];
        else if (layer === 'health') weight = CATEGORY_WEIGHTS['health'];

        let severity = topic.severity;
        if (!severity && topic.impact_level) severity = IMPACT_TO_SEVERITY[topic.impact_level];
        if (!severity) severity = 3;

        // [SỬA] Không còn mặc định "thiếu sentiment = tiêu cực (-1)".
        // Lý do: tin tức chưa được AI gắn nhãn sắc thái (undefined) hoàn toàn có thể là tin tốt hoặc trung lập
        // (ví dụ "Petrolimex thu kỷ lục", "lắp pin mặt trời xanh hóa nhà kho"). Mặc định nó là -1 khiến những
        // tin này luôn bị xếp vào mục "🔴 Căng thẳng/Bất ổn" một cách oan uổng. Giờ coi thiếu dữ liệu = trung lập (0),
        // và tin trung lập chỉ có ảnh hưởng RẤT NHẸ (không thiên tốt/xấu) thay vì nghiêng về tích cực như code cũ.
        let sentiment = (topic.sentiment !== undefined && topic.sentiment !== null) ? topic.sentiment : 0;
        let sentimentMultiplier = (sentiment === 0) ? 0.3 : sentiment;

        if (topic.scope === 'global') severity += 1;

        const rawScore = severity * weight * sentimentMultiplier * decay;
        if (Math.abs(rawScore) < 0.1) return; // Bỏ qua rác siêu nhỏ


        if (topic.regions && topic.regions.length > 0) {
            // [ĐÃ SỬA] Loại bỏ mã GLOBAL để không tô màu toàn thế giới gây nhiễu
            const validRegions = topic.regions.filter(r => r.toUpperCase() !== 'GLOBAL');

            validRegions.forEach(regionId => {
                let isoCodes = [];
                // Nếu AI trả về tên khu vực cũ (vietnam, usa), dùng bảng map
                if (REGION_TO_ISO[regionId.toLowerCase()]) {
                    isoCodes = REGION_TO_ISO[regionId.toLowerCase()];
                }
                // Nếu AI đã trả về sẵn mã ISO chuẩn (VN, US, IR), lấy luôn mã đó
                else {
                    isoCodes = [regionId.toUpperCase()];
                }

                isoCodes.forEach(iso => {
                    if (!regionData[iso]) regionData[iso] = { events: [] };
                    // Chống lặp sự kiện
                    if (!regionData[iso].events.some(e => e.title === (topic.title || topic.cluster_title))) {
                        regionData[iso].events.push({
                            title: topic.title || topic.cluster_title,
                            score: rawScore,
                            layer: layer,
                            sentiment: sentiment
                        });
                    }
                });
            });
        }
    });

    const finalMapData = {};

    for (const [isoCode, data] of Object.entries(regionData)) {
        data.events.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
        // [SỬA] Tăng số lượng event giữ lại (xem giải thích ở MAX_EVENTS_PER_REGION phía trên)
        const topEvents = data.events.slice(0, MAX_EVENTS_PER_REGION);

        const layerScores = { total: 0, security: 0, economy: 0, disaster: 0, health: 0, general: 0 };
        // [SỬA] Tính layerScores dựa trên TOÀN BỘ topEvents đã lấy (không chỉ 5 event tổng như trước),
        // để layer nào cũng phản ánh đúng dữ liệu của chính nó, không bị lệch vì bị các layer khác lấn top5.
        topEvents.forEach(evt => {
            layerScores.total += evt.score;
            layerScores[evt.layer] += evt.score;
        });

        // Lấy dữ liệu cũ (nếu có)
        const previousSI = previousData[isoCode];
        const finalLayers = {};

        for (let l in layerScores) {
            // NẾU CÓ lịch sử: Áp dụng công thức mượt mà (30% nay + 70% cũ)
            if (previousSI && previousSI.layers && previousSI.layers[l] !== undefined) {
                finalLayers[l] = (0.3 * layerScores[l]) + (0.7 * previousSI.layers[l]);
            }
            // NẾU KHÔNG CÓ lịch sử (Chạy ngày đầu tiên): Lấy 100% sức nặng của tin tức hôm nay!
            else {
                finalLayers[l] = layerScores[l];
            }
        }

        // [SỬA] Xác định trạng thái/màu dựa theo GIÁ TRỊ CÓ DẤU của total, không dùng trị tuyệt đối nữa.
        // Lý do: code cũ dùng Math.abs(total) nên một khu vực có nhiều TIN TỐT dồn dập (total dương lớn)
        // vẫn bị gắn nhãn "Diễn biến nghiêm trọng"/màu đỏ y như đang khủng hoảng thật (total âm lớn).
        // Giờ: âm lớn -> báo động (đỏ/cam/vàng), dương lớn -> diễn biến tích cực (không dùng màu báo động),
        // chỉ có vùng gần 0 mới là "ổn định" trung tính thật sự.
        const total = finalLayers.total;
        let status = 'Ổn định', color = '#22c55e';

        if (total <= -8) { status = 'Diễn biến nghiêm trọng'; color = '#ef4444'; }
        else if (total <= -5) { status = 'Diễn biến phức tạp'; color = '#f97316'; }
        else if (total <= -2) { status = 'Cần theo dõi'; color = '#eab308'; }
        else if (total >= 8) { status = 'Tiến triển vượt bậc'; color = '#0ea5e9'; }
        else if (total >= 2) { status = 'Diễn biến tích cực'; color = '#22c55e'; }
        // else: giữ nguyên 'Ổn định' / '#22c55e' cho vùng -2..2 (gần như không biến động)

        finalMapData[isoCode] = {
            status: status,
            color: color,
            si_score: parseFloat(total.toFixed(2)),
            layers: finalLayers,
            // [SỬA] Giữ lại field "layer" khi xuất event ra ngoài — trước đây bị bỏ mất ở bước map(),
            // khiến frontend (ui-map.js) không có cách nào lọc sự kiện theo lớp (quân sự/kinh tế/...)
            // dù người dùng đã chọn bộ lọc khác 'total'.
            events: topEvents.map(e => ({
                title: e.title,
                score: parseFloat(e.score.toFixed(2)),
                sentiment: e.sentiment,
                layer: e.layer
            }))
        };
    }

    return finalMapData;
}

module.exports = { buildDigest, buildSituationIndexData };

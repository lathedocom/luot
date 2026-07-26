// FILE: script_bot/modules/digest/digest_builder.js

function buildDigest(allTopics, { limitPerRegion = 7, windowMs = 48 * 60 * 60 * 1000 } = {}) {
    const now = Date.now();
    
    // Lọc theo thời gian (windowMs, mặc định 48h) để tránh tin cũ chiếm chỗ
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

    return {
        vietnam: topN(buckets.vietnam),
        asia: topN(buckets.asia),
        global: topN(buckets.global),
        generated_at: Date.now()
    };
}

// =====================================================================
// [NEW] RISK ENGINE: XỬ LÝ DỮ LIỆU BẢN ĐỒ RỦI RO CHO JSVECTORMAP
// =====================================================================

// Bộ quy đổi từ Region ID nội bộ sang mã ISO 3166-1 alpha-2 của jsVectorMap
const REGION_TO_ISO = {
    'vietnam': ['VN'],
    'usa': ['US'],
    'china': ['CN', 'TW', 'HK'], // Gộp rủi ro khu vực
    'eu': ['GB', 'FR', 'DE', 'IT', 'ES', 'UA', 'RU'], // Tạm map các nước lớn và điểm nóng
    'asean': ['SG', 'TH', 'MY', 'ID', 'PH'],
    'asia': ['JP', 'KR', 'IN'],
    'middle_east': ['IL', 'PS', 'IR', 'SY', 'LB']
};

// Bộ chấm điểm Mức độ nghiêm trọng (Severity) dựa trên categories
const SEVERITY_SCORES = {
    'military': 100,  // Chiến tranh, xung đột
    'law': 50,        // Tội phạm, pháp lý
    'economy': 40,    // Khủng hoảng kinh tế
    'finance': 40,    // Biến động tài chính
    'politics': 30,   // Bất ổn chính trị, biểu tình
    'tech': 10,
    'science': 10
};

function buildRiskMapData(allTopics) {
    const now = Date.now();
    const mapData = {};

    // Chỉ xét các tin tức trong vòng 7 ngày qua để tạo dư âm rủi ro
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const activeTopics = allTopics.filter(t => (now - (t.timestamp || 0)) <= SEVEN_DAYS);

    activeTopics.forEach(topic => {
        // 1. Tính TimeDecay (Hệ số suy giảm theo thời gian)
        const ageHours = (now - topic.timestamp) / (1000 * 60 * 60);
        let timeDecay = 1.0;
        if (ageHours > 72) timeDecay = 0.3;      // Tin > 3 ngày: 30% sức ảnh hưởng
        else if (ageHours > 24) timeDecay = 0.7; // Tin > 1 ngày: 70% sức ảnh hưởng

        // 2. Tính Mức độ nghiêm trọng (Severity) từ Categories
        let severity = 0;
        if (topic.categories && topic.categories.length > 0) {
            topic.categories.forEach(cat => {
                if (SEVERITY_SCORES[cat]) severity += SEVERITY_SCORES[cat];
            });
        }
        // AI có thể đánh giá scope global -> tăng trọng số rủi ro
        if (topic.scope === 'global') severity += 20; 

        // 3. Tính SourceWeight (Độ tin cậy nguồn)
        let sourceWeight = 1.0;
        if (topic.sources && topic.sources.length > 0) {
            const avgCredibility = topic.sources.reduce((sum, s) => sum + (s.source_credibility || 5), 0) / topic.sources.length;
            sourceWeight = avgCredibility / 10; // Ví dụ: Reuters 10 -> 1.0, Báo lá cải 5 -> 0.5
        }

        // Tính điểm sự kiện
        const eventRiskScore = severity * sourceWeight * timeDecay;

        // Bỏ qua nếu điểm quá thấp không đáng ghi nhận là "Rủi ro"
        if (eventRiskScore < 10) return;

        // 4. Phân bổ điểm rủi ro cho các quốc gia tương ứng
        if (topic.regions && topic.regions.length > 0) {
            topic.regions.forEach(regionId => {
                const isoCodes = REGION_TO_ISO[regionId] || [];
                isoCodes.forEach(iso => {
                    if (!mapData[iso]) {
                        mapData[iso] = { score: 0, events: [] };
                    }
                    mapData[iso].score += eventRiskScore;
                    
                    // Chỉ lưu tóm tắt sự kiện để hiển thị Modal
                    if (mapData[iso].events.length < 5) {
                        mapData[iso].events.push({
                            title: topic.title,
                            score: Math.round(eventRiskScore)
                        });
                    }
                });
            });
        }
    });

    // 5. Chuẩn hóa dữ liệu trả về cho Frontend
    const finalMap = {};
    for (const [iso, data] of Object.entries(mapData)) {
        const totalScore = Math.round(data.score);
        let color = '#22c55e'; // Xanh lá mặc định
        let status = 'Bình thường';

        if (totalScore >= 150) { color = '#ef4444'; status = 'Khủng hoảng nghiêm trọng'; }
        else if (totalScore >= 80) { color = '#f97316'; status = 'Rủi ro cao'; }
        else if (totalScore >= 30) { color = '#eab308'; status = 'Đang theo dõi'; }

        finalMap[iso] = {
            score: totalScore,
            color: color,
            status: status,
            events: data.events
        };
    }

    return finalMap;
}

module.exports = { buildDigest, buildRiskMapData };

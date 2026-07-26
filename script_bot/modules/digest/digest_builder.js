// Thêm từ điển ánh xạ ISO 3166-1 alpha-2 để jsVectorMap có thể hiểu được
const ISO_COUNTRY_MAP = {
    'vietnam': 'VN',
    'usa': 'US',
    'china': 'CN',
    'japan': 'JP',
    'korea': 'KR',
    'india': 'IN',
    'israel': 'IL',
    'ukraine': 'UA',
    'russia': 'RU',
    'uk': 'GB',
    'france': 'FR',
    'germany': 'DE'
    // 'eu', 'asean', 'middle_east' là các cụm khu vực nên không có mã quốc gia đơn lẻ.
};

/**
 * Hàm mới: Quét và chấm điểm các quốc gia để vẽ bản đồ
 */
function buildMapData(allTopics, { windowMs = 48 * 60 * 60 * 1000 } = {}) {
    const now = Date.now();
    const mapData = {};

    // Lọc các chủ đề mới trong khoảng thời gian quy định (mặc định 48h)
    const recentTopics = allTopics.filter(t => {
        const topicTime = t.last_updated || t.timestamp || 0;
        return (now - topicTime) <= windowMs;
    });

    // Cộng dồn điểm (value_score hoặc importance) cho từng quốc gia xuất hiện trong tin tức
    recentTopics.forEach(topic => {
        const regions = topic.regions || [];
        const scoreToAdd = topic.value_score || topic.importance || 10;

        regions.forEach(regionId => {
            const isoCode = ISO_COUNTRY_MAP[regionId];
            if (isoCode) {
                if (!mapData[isoCode]) {
                    mapData[isoCode] = { score: 0, status: "Bình thường", color: "#22c55e", trend: "→" };
                }
                mapData[isoCode].score += scoreToAdd;
            }
        });
    });

    // Cập nhật trạng thái và màu sắc (Đỏ, Cam, Vàng) dựa trên tổng điểm của quốc gia đó
    for (const [iso, data] of Object.entries(mapData)) {
        if (data.score >= 200) {
            data.status = "Khủng hoảng";
            data.color = "#ef4444"; 
            data.trend = "↑";
        } else if (data.score >= 100) {
            data.status = "Điểm nóng";
            data.color = "#f97316"; 
            data.trend = "↑";
        } else if (data.score >= 30) {
            data.status = "Đang theo dõi";
            data.color = "#eab308"; 
            data.trend = "→";
        }
    }

    return mapData;
}

function buildDigest(allTopics, { limitPerRegion = 7, windowMs = 48 * 60 * 60 * 1000 } = {}) {
    const now = Date.now();
    
    // Lọc theo thời gian (windowMs, mặc định 48h) để tránh tin cũ chiếm chỗ
    const recentTopics = allTopics.filter(t => {
        const topicTime = t.last_updated || t.timestamp || 0;
        return (now - topicTime) <= windowMs;
    });

    const buckets = { vietnam: [], asia: [], global: [] };
    const ASIA_REGIONS = ['china', 'asean']; // Định nghĩa nhóm Châu Á

    // Phân 3 nhóm không trùng lặp theo mức độ ưu tiên
    recentTopics.forEach(t => {
        const regions = t.regions || [];
        if (regions.includes('vietnam')) {
            buckets.vietnam.push(t);
        } else if (regions.some(r => ASIA_REGIONS.includes(r))) {
            buckets.asia.push(t);
        } else {
            buckets.global.push(t); // Mỹ, EU, Toàn cầu hoặc không xác định
        }
    });

    // Hàm map tạo object gọn (lightweight payload)
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

    // Sắp xếp theo value_score và lấy top N
    const topN = (arr) => arr
        .sort((a, b) => (b.value_score || 0) - (a.value_score || 0))
        .slice(0, limitPerRegion)
        .map(mapLightweight);

    return {
        vietnam: topN(buckets.vietnam),
        asia: topN(buckets.asia),
        global: topN(buckets.global),
        map_data: buildMapData(allTopics, { windowMs }), // Kích hoạt dữ liệu bản đồ
        generated_at: Date.now()
    };
}

module.exports = { buildDigest, buildMapData };

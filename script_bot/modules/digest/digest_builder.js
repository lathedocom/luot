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
        generated_at: Date.now()
    };
}

module.exports = { buildDigest };

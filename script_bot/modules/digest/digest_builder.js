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
    'canada': ['CA'],
    'china': ['CN', 'TW', 'HK'], 
    'eu': ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'CH', 'SE', 'PL'], 
    'russia_ukraine': ['RU', 'UA', 'BY'],
    // Đã thêm KH (Campuchia), LA (Lào)
    'asean': ['SG', 'TH', 'MY', 'ID', 'PH', 'KH', 'LA', 'MM', 'BN'], 
    'asia': ['JP', 'KR', 'IN', 'PK', 'BD', 'LK'],
    'middle_east': ['IL', 'PS', 'IR', 'SY', 'LB', 'SA', 'AE', 'QA', 'IQ', 'YE'],
    // [MỚI]
    'oceania': ['AU', 'NZ'], 
    'latin_america': ['BR', 'AR', 'MX', 'CO', 'CL', 'PE', 'VE'], 
    'africa': ['ZA', 'GH', 'NG', 'EG', 'KE', 'ET'] 
};

// [MỚI] Bảng điểm Cơ sở dựa trên nhãn ảnh hưởng (Impact Level) của AI
const IMPACT_SCORES = {
    'crisis': 100,       // Khủng hoảng, chiến tranh, dịch bệnh lớn
    'risk': 50,          // Bất ổn, cảnh báo rủi ro
    'monitor': 20,       // Đàm phán, chính sách, biến động bình thường
    'development': 5     // Phát triển, hợp tác (Gần như không tạo rủi ro)
};

// [Fallback] Dùng chuyên mục nếu bài báo cũ chưa có nhãn AI
const SEVERITY_SCORES = {
    'military': 80, 
    'law': 40,      
    'economy': 30,  
    'finance': 30,  
    'politics': 20, 
    'environment': 40,
    'health': 40
};

function buildRiskMapData(allTopics) {
    const now = Date.now();
    const mapData = {};

    // Chỉ xét các tin tức trong vòng 7 ngày qua để tạo dư âm rủi ro
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const activeTopics = allTopics.filter(t => (now - (t.timestamp || 0)) <= SEVEN_DAYS);

    activeTopics.forEach(topic => {
        // 1. Tính TimeDecay (Hệ số suy giảm theo thời gian nhanh hơn)
        const ageHours = (now - topic.timestamp) / (1000 * 60 * 60);
        let timeDecay = 1.0;
        if (ageHours > 72) timeDecay = 0.2;      // Tin > 3 ngày: Mờ nhạt (20% ảnh hưởng)
        else if (ageHours > 24) timeDecay = 0.6; // Tin > 1 ngày: Giảm nhiệt (60% ảnh hưởng)

        // 2. Tính Mức độ nghiêm trọng (Severity) - Ưu tiên cờ AI
        let baseSeverity = 0;
        if (topic.impact_level && IMPACT_SCORES[topic.impact_level]) {
            baseSeverity = IMPACT_SCORES[topic.impact_level];
        } else {
            // Fallback: Nếu là tin cũ, lấy điểm cao nhất của chuyên mục (không cộng dồn)
            if (topic.categories && topic.categories.length > 0) {
                topic.categories.forEach(cat => {
                    if (SEVERITY_SCORES[cat] && SEVERITY_SCORES[cat] > baseSeverity) {
                        baseSeverity = SEVERITY_SCORES[cat];
                    }
                });
            }
        }

        // Tăng sức nặng nếu AI xếp hạng sự kiện này lan rông toàn cầu
        if (topic.scope === 'global') baseSeverity += 10; 

        // 3. Tính SourceWeight (Độ tin cậy nguồn)
        let sourceWeight = 1.0;
        if (topic.sources && topic.sources.length > 0) {
            const avgCredibility = topic.sources.reduce((sum, s) => sum + (s.source_credibility || 5), 0) / topic.sources.length;
            sourceWeight = avgCredibility / 10; 
        }

        // Điểm sự kiện đơn lẻ
        const eventRiskScore = baseSeverity * sourceWeight * timeDecay;

        // Bỏ qua nếu điểm quá thấp (tin tức rác)
        if (eventRiskScore < 5) return;

        // 4. Phân bổ điểm cho các quốc gia tương ứng
        if (topic.regions && topic.regions.length > 0) {
            topic.regions.forEach(regionId => {
                const isoCodes = REGION_TO_ISO[regionId] || [];
                isoCodes.forEach(iso => {
                    if (!mapData[iso]) {
                        mapData[iso] = { events: [] };
                    }
                    
                    // Lưu tóm tắt sự kiện để hiển thị Modal (tối đa 5 tin)
                    if (mapData[iso].events.length < 5) {
                        mapData[iso].events.push({
                            title: topic.title || topic.cluster_title,
                            score: Math.round(eventRiskScore)
                        });
                    }
                });
            });
        }
    });

    // 5. Chuẩn hóa và áp dụng thuật toán CHỐNG DỒN ĐIỂM
    const finalMap = {};
    for (const [iso, data] of Object.entries(mapData)) {
        
        // Sắp xếp sự kiện từ nghiêm trọng nhất xuống thấp nhất
        data.events.sort((a, b) => b.score - a.score);
        
        let totalScore = 0;
        if (data.events.length > 0) {
            // Sự kiện nghiêm trọng nhất giữ 100% sức mạnh
            totalScore = data.events[0].score;
            
            // Các sự kiện phụ trợ chỉ đóng góp 15% dư chấn (tránh việc nhiều tin nhỏ làm đỏ bản đồ)
            for (let i = 1; i < data.events.length; i++) {
                totalScore += data.events[i].score * 0.15;
            }
        }

        totalScore = Math.round(totalScore);
        
        let color = '#22c55e'; 
        let status = 'Bình thường';

        // Thang đo mới phản chiếu chính xác nhãn của AI
        if (totalScore >= 85) { color = '#ef4444'; status = 'Khủng hoảng nghiêm trọng'; }
        else if (totalScore >= 45) { color = '#f97316'; status = 'Rủi ro cao'; }
        else if (totalScore >= 15) { color = '#eab308'; status = 'Đang theo dõi'; }

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

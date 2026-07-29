// FILE: script_bot/modules/market/macro_health.js

// Khai báo 8 trụ cột vĩ mô kèm thuộc tính Inverse (Nghịch đảo)
// inverse = true: Giá tăng -> Điểm âm (Xấu). inverse = false: Giá tăng -> Điểm dương (Tốt)
const HEALTH_CATEGORIES = {
    'chi_phi': { name: 'Chi phí sinh hoạt', icon: '🛒', inverse: true, keywords: ['lạm phát', 'giá cả', 'xăng', 'điện', 'cpi', 'thực phẩm', 'heo hơi'], market_keys: ['RON95', 'E5RON92', 'GOLD_SJC'] },
    'san_xuat': { name: 'Sản xuất & Công nghiệp', icon: '🏭', inverse: false, keywords: ['pmi', 'nhà máy', 'sản xuất', 'công nghiệp', 'fdi', 'đơn hàng'], market_keys: [] },
    'thuong_mai': { name: 'Thương mại & XNK', icon: '🚢', inverse: false, keywords: ['xuất khẩu', 'nhập khẩu', 'container', 'cảng', 'thương mại', 'tỷ giá'], market_keys: ['USD_VND'] },
    'xay_dung': { name: 'Xây dựng & Vật liệu', icon: '🏗️', inverse: false, keywords: ['bất động sản', 'xây dựng', 'xi măng', 'thép', 'cát', 'đầu tư công'], market_keys: ['STEEL_CB300', 'CEMENT', 'SAND', 'STEEL_HRC'] },
    'tieu_dung': { name: 'Tiêu dùng & Bán lẻ', icon: '🛍️', inverse: false, keywords: ['bán lẻ', 'mua sắm', 'tiêu dùng', 'doanh thu', 'du lịch', 'dịch vụ'], market_keys: [] },
    'dau_tu': { name: 'Đầu tư & Tài chính', icon: '📈', inverse: false, keywords: ['chứng khoán', 'cổ phiếu', 'lãi suất', 'ngân hàng', 'đầu tư', 'trái phiếu', 'tín dụng'], market_keys: ['VNINDEX', 'HNX', 'US10Y'] },
    'nong_nghiep': { name: 'Nông nghiệp', icon: '🌾', inverse: false, keywords: ['gạo', 'cà phê', 'hồ tiêu', 'cao su', 'phân bón', 'nông sản'], market_keys: ['RICE_VN', 'COFFEE_VN', 'PEPPER_VN', 'RUBBER_VN', 'CASHEW_VN'] },
    'nang_luong': { name: 'Năng lượng', icon: '⚡', inverse: true, keywords: ['dầu', 'khí đốt', 'năng lượng', 'điện', 'than', 'lng'], market_keys: ['BRENT', 'WTI', 'NAT_GAS'] }
};

function buildMacroHealth(topics, marketData = []) {
    const now = Date.now();
    const results = [];

    // Lọc tin tức trong 7 ngày
    const recentEconTopics = topics.filter(t => 
        (now - (t.timestamp || now)) <= 7 * 24 * 60 * 60 * 1000 &&
        t.categories && (t.categories.includes('economy') || t.categories.includes('finance') || t.categories.includes('business'))
    );

    for (const [key, category] of Object.entries(HEALTH_CATEGORIES)) {
        let dataScore = 0; // 60%
        let trendScore = 0; // 15%
        let newsScore = 0; // 25%
        let reasons = []; // Mảng chứa các gạch đầu dòng giải thích

        // --- 1. XỬ LÝ DỮ LIỆU ĐỊNH LƯỢNG & XU HƯỚNG (MARKET DATA) ---
        const relatedMarkets = marketData.filter(m => category.market_keys.includes(m.id) && m.status !== 'offline');
        
        if (relatedMarkets.length > 0) {
            let totalChange = 0;
            let totalTrend = 0;

            relatedMarkets.forEach(m => {
                const change = m.raw_change || 0;
                totalChange += change;

                // Tạo lý do từ dữ liệu thị trường nếu biến động > 1%
                if (Math.abs(change) > 1) {
                    const directionText = change > 0 ? 'tăng' : 'giảm';
                    reasons.push(`${m.name} ${directionText} ${Math.abs(change).toFixed(1)}%`);
                }

                // Tính xu hướng 30 ngày (Dựa vào mảng history)
                if (m.history && m.history.length >= 2) {
                    const oldest = m.history[0];
                    const newest = m.history[m.history.length - 1];
                    if (oldest > 0) {
                        totalTrend += ((newest - oldest) / oldest) * 100;
                    }
                }
            });

            // Chuẩn hóa điểm Data (-100 đến 100) - Coi biến động 5% là kịch trần (100 điểm)
            let avgChange = totalChange / relatedMarkets.length;
            dataScore = Math.max(-100, Math.min(100, (avgChange / 5) * 100));

            // Chuẩn hóa điểm Trend
            let avgTrend = totalTrend / relatedMarkets.length;
            trendScore = Math.max(-100, Math.min(100, (avgTrend / 10) * 100));

            // Đảo ngược điểm nếu là nhóm Chi phí/Năng lượng (Tăng = Xấu = Âm)
            if (category.inverse) {
                dataScore = -dataScore;
                trendScore = -trendScore;
            }
        }

        // --- 2. XỬ LÝ DỮ LIỆU TIN TỨC (NEWS) ---
        const relatedTopics = recentEconTopics.filter(t => 
            category.keywords.some(kw => (t.title + ' ' + (t.short_summary || '')).toLowerCase().includes(kw))
        );

        if (relatedTopics.length > 0) {
            let totalNewsImpact = 0;
            relatedTopics.forEach(t => {
                const sentiment = t.sentiment !== undefined ? t.sentiment : 0; 
                const severity = t.severity || 2; // 1-5
                // Quy đổi: Sentiment (-1, 0, 1) * Severity (1-5) * 20 = Khoảng -100 đến 100
                totalNewsImpact += sentiment * severity * 20;
            });

            newsScore = Math.max(-100, Math.min(100, totalNewsImpact / relatedTopics.length));

            // Lấy 1 tin tức nghiêm trọng nhất làm lý do bổ sung
            relatedTopics.sort((a, b) => (b.severity || 0) - (a.severity || 0));
            reasons.push(relatedTopics[0].title);
        }

        // --- 3. TỔNG HỢP ĐIỂM SỐ (60% - 25% - 15%) ---
        // Nếu không có Data thị trường, dồn tỷ trọng cho News
        let finalScore = 0;
        if (relatedMarkets.length > 0) {
            finalScore = (dataScore * 0.6) + (newsScore * 0.25) + (trendScore * 0.15);
        } else {
            finalScore = newsScore; 
        }

        // --- 4. ÁNH XẠ TRẠNG THÁI VÀ GIAO DIỆN ---
        let status = 'Bình thường / Tích cực', color = '#3b82f6', trendIcon = '→', trendText = 'Ổn định';

        if (finalScore >= 60) {
            status = 'Tăng trưởng mạnh'; color = '#10b981'; trendIcon = '↑'; trendText = 'Cải thiện mạnh';
        } else if (finalScore >= 20) {
            status = 'Khả quan'; color = '#10b981'; trendIcon = '↑'; trendText = 'Đang cải thiện';
        } else if (finalScore >= -19) {
            status = 'Đang theo dõi'; color = '#facc15'; trendIcon = '→'; trendText = 'Đi ngang';
        } else if (finalScore >= -59) {
            status = 'Có dấu hiệu suy yếu'; color = '#f97316'; trendIcon = '↓'; trendText = 'Xu hướng xấu đi';
        } else {
            status = 'Suy yếu mạnh'; color = '#ef4444'; trendIcon = '↓'; trendText = 'Suy giảm nghiêm trọng';
        }

        // Tinh chỉnh từ ngữ cho nhóm Nghịch đảo (Chi phí sinh hoạt)
        if (category.inverse && finalScore < -20) status = 'Áp lực tăng cao';
        if (category.inverse && finalScore > 20) status = 'Đang hạ nhiệt';

        // Lọc lại Reasons (Tối đa 3 gạch đầu dòng)
        const uniqueReasons = [...new Set(reasons)].slice(0, 3);
        if (uniqueReasons.length === 0) uniqueReasons.push("Dữ liệu duy trì ở mức ổn định theo chu kỳ.");

        results.push({
            id: key,
            name: category.name,
            icon: category.icon,
            score: parseFloat(finalScore.toFixed(2)),
            status: status,
            color: color,
            trend_icon: trendIcon,
            trend_text: trendText,
            reasons: uniqueReasons
        });
    }

    return results;
}

module.exports = { buildMacroHealth };

// FILE: script_bot/modules/market/macro_health.js

const HEALTH_CATEGORIES = {
    'chi_phi': { 
        name: 'Chi phí sinh hoạt', icon: '🛒', inverse: true, 
        drivers: ['CPI', 'Giá xăng', 'Giá điện', 'Giá gạo', 'Giá heo hơi'],
        market_keys: ['RON95', 'E5RON92', 'GOLD_SJC', 'RICE_VN', 'COFFEE_VN', 'PEPPER_VN']
    },
    'san_xuat': { 
        name: 'Sản xuất & Công nghiệp', icon: '🏭', inverse: false, 
        drivers: ['PMI', 'Sản lượng CN (IIP)', 'Điện công nghiệp', 'Giá thép', 'Giá đồng'],
        market_keys: ['COPPER', 'STEEL_HRC', 'STEEL_CB300', 'ALUMINUM']
    },
    'thuong_mai': { 
        name: 'Thương mại & Xuất nhập khẩu', icon: '🚢', inverse: false, 
        drivers: ['Xuất khẩu', 'Nhập khẩu', 'Tỷ giá USD/VND', 'Cước container'],
        market_keys: ['USD_VND', 'DXY', 'BRENT']
    },
    'xay_dung': { 
        name: 'Xây dựng & Vật liệu', icon: '🏗️', inverse: false, 
        drivers: ['Giá thép', 'Xi măng', 'Cát', 'Đầu tư công', 'Bất động sản'],
        market_keys: ['STEEL_CB300', 'CEMENT', 'SAND', 'STEEL_HRC', 'IRON_ORE']
    },
    'dau_tu': { 
        name: 'Đầu tư & Tài chính', icon: '📈', inverse: false, 
        drivers: ['VN-Index', 'VN30', 'Lãi suất', 'Tín dụng', 'FDI'],
        market_keys: ['VNINDEX', 'HNX', 'US10Y'] 
    },
    'tieu_dung': { 
        name: 'Tiêu dùng & Bán lẻ', icon: '🛍️', inverse: false, 
        drivers: ['Bán lẻ', 'CPI', 'Thương mại điện tử', 'Du lịch'],
        market_keys: [] // Chờ tích hợp API Dữ liệu vĩ mô
    }
};

function buildMacroHealth(topics, marketData = []) {
    const results = [];

    for (const [key, category] of Object.entries(HEALTH_CATEGORIES)) {
        let finalScore = 0;
        let reasons = [];
        let validIndicators = 0;

        // 1. Quét dữ liệu định lượng (Thị trường)
        const relatedMarkets = marketData.filter(m => category.market_keys.includes(m.id) && m.status !== 'offline');
        
        if (relatedMarkets.length > 0) {
            relatedMarkets.forEach(m => {
                const change = m.raw_change || 0;
                // Chuẩn hóa điểm biến động (-100 đến 100), giả định biến động 5% là kịch trần
                let normalizedScore = Math.max(-100, Math.min(100, (change / 5) * 100));
                
                // Nghịch đảo điểm nếu thuộc nhóm Chi phí sinh hoạt (Tăng là Xấu)
                if (category.inverse) normalizedScore = -normalizedScore;

                finalScore += normalizedScore;
                validIndicators++;

                // 2. Tự động sinh câu giải thích từ dữ liệu thật
                if (Math.abs(change) > 0.1) {
                    const directionText = change > 0 ? 'tăng' : 'giảm';
                    reasons.push(`${m.name} ${directionText} ${Math.abs(change).toFixed(2)}%`);
                }
            });
            finalScore = finalScore / validIndicators; // Lấy trung bình
        } else {
            // Fallback nếu không có data (Giữ ở mức ổn định)
            finalScore = 0;
        }

        // 3. Quy đổi điểm (-100 đến 100) sang Trạng thái & Màu sắc
        let status = 'Bình thường', color = '#3b82f6', trendIcon = '→', trendText = 'Ổn định';

        if (finalScore >= 60) {
            status = 'Tăng trưởng mạnh'; color = '#10b981'; trendIcon = '↑'; trendText = 'Cải thiện mạnh';
        } else if (finalScore >= 20) {
            status = 'Tích cực / Khả quan'; color = '#10b981'; trendIcon = '↑'; trendText = 'Đang cải thiện';
        } else if (finalScore >= -19) {
            status = 'Bình thường / Theo dõi'; color = '#facc15'; trendIcon = '→'; trendText = 'Đi ngang';
        } else if (finalScore >= -59) {
            status = 'Có dấu hiệu suy yếu'; color = '#f97316'; trendIcon = '↓'; trendText = 'Xu hướng xấu đi';
        } else {
            status = 'Suy yếu mạnh'; color = '#ef4444'; trendIcon = '↓'; trendText = 'Suy giảm nghiêm trọng';
        }

        // Tinh chỉnh từ ngữ chuyên biệt cho nhóm Chi phí / Năng lượng
        if (category.inverse) {
            if (finalScore <= -60) { status = 'Áp lực tăng rất cao'; trendText = 'Tăng mạnh'; }
            else if (finalScore <= -20) { status = 'Có dấu hiệu tăng'; trendText = 'Đang tăng'; }
            else if (finalScore >= 20) { status = 'Đang hạ nhiệt'; trendText = 'Giảm nhẹ'; }
            else if (finalScore >= 60) { status = 'Chi phí giảm'; trendText = 'Giảm mạnh'; }
        }

        // 4. Định dạng câu giải thích
        let explanation = '';
        if (reasons.length > 0) {
            explanation = reasons.join(', ') + '.';
        } else {
            explanation = 'Các chỉ số cốt lõi hiện tại đang dao động ở mức biên độ hẹp, chưa hình thành xu hướng rõ rệt.';
        }

        results.push({
            id: key,
            name: category.name,
            icon: category.icon,
            score: parseFloat(finalScore.toFixed(2)),
            status: status,
            color: color,
            trend_icon: trendIcon,
            trend_text: trendText,
            drivers: category.drivers, // Truyền Động lực chính xuống Frontend
            explanation: explanation
        });
    }

    return results;
}

module.exports = { buildMacroHealth };

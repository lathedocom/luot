// FILE: script_bot/modules/market/macro_health.js

const HEALTH_CATEGORIES = {
    'chi_phi': { name: 'Chi phí sinh hoạt', keywords: ['lạm phát', 'giá cả', 'xăng', 'điện', 'cpi', 'thực phẩm'] },
    'san_xuat': { name: 'Sản xuất & Công nghiệp', keywords: ['pmi', 'nhà máy', 'sản xuất', 'công nghiệp', 'fdi'] },
    'thuong_mai': { name: 'Thương mại & Xuất nhập khẩu', keywords: ['xuất khẩu', 'nhập khẩu', 'container', 'cảng', 'thương mại'] },
    'xay_dung': { name: 'Xây dựng & Vật liệu', keywords: ['bất động sản', 'xây dựng', 'xi măng', 'thép', 'cát'] },
    'dau_tu': { name: 'Đầu tư & Tài chính', keywords: ['chứng khoán', 'cổ phiếu', 'lãi suất', 'ngân hàng', 'đầu tư'] },
    'tieu_dung': { name: 'Tiêu dùng & Bán lẻ', keywords: ['bán lẻ', 'mua sắm', 'tiêu dùng', 'doanh thu'] }
};

function buildMacroHealth(topics) {
    const now = Date.now();
    const scores = { chi_phi: 0, san_xuat: 0, thuong_mai: 0, xay_dung: 0, dau_tu: 0, tieu_dung: 0 };

    // Lọc tin tức trong 7 ngày gần nhất thuộc mảng Kinh tế
    const recentEconTopics = topics.filter(t => 
        (now - (t.timestamp || now)) <= 7 * 24 * 60 * 60 * 1000 &&
        t.categories && (t.categories.includes('economy') || t.categories.includes('finance') || t.categories.includes('business'))
    );

    recentEconTopics.forEach(topic => {
        const text = (topic.title + ' ' + topic.short_summary).toLowerCase();
        let sentiment = topic.sentiment !== undefined ? topic.sentiment : 0; 
        const severity = topic.severity || 2;
        const decay = Math.max(0.2, 1 - ((now - topic.timestamp) / (1000 * 60 * 60 * 24)) * 0.15);
        
        const impactScore = sentiment * severity * decay;

        // Phân loại điểm vào các nhóm tương ứng
        for (const [key, category] of Object.entries(HEALTH_CATEGORIES)) {
            if (category.keywords.some(kw => text.includes(kw))) {
                scores[key] += impactScore;
            }
        }
    });

    const results = [];
    
    // Đánh giá trạng thái dựa trên điểm số
    for (const [key, category] of Object.entries(HEALTH_CATEGORIES)) {
        const score = scores[key];
        let status = 'Ổn định', color = '#22c55e', icon = '🟢';

        // Xử lý riêng cho "Chi phí sinh hoạt" (Tăng là Tiêu cực, Giảm là Tích cực)
        if (key === 'chi_phi') {
            if (score <= -4) { status = 'Tăng mạnh'; color = '#ef4444'; icon = '🔴'; }
            else if (score <= -1.5) { status = 'Đang tăng'; color = '#f97316'; icon = '🟠'; }
            else if (score >= 3) { status = 'Đang giảm'; color = '#10b981'; icon = '🟢'; }
            else { status = 'Bình thường'; color = '#3b82f6'; icon = '🔵'; }
        } else {
            // Các nhóm khác (Tăng là Tích cực, Giảm là Tiêu cực)
            if (score >= 4) { status = 'Tăng trưởng tốt'; color = '#10b981'; icon = '🟢'; }
            else if (score >= 1.5) { status = 'Dấu hiệu phục hồi'; color = '#facc15'; icon = '🟡'; }
            else if (score <= -4) { status = 'Suy yếu mạnh'; color = '#ef4444'; icon = '🔴'; }
            else if (score <= -1.5) { status = 'Có dấu hiệu giảm'; color = '#f97316'; icon = '🟠'; }
            else { status = 'Bình thường'; color = '#3b82f6'; icon = '🔵'; }
        }

        results.push({ id: key, name: category.name, score: parseFloat(score.toFixed(2)), status, color, icon });
    }

    return results;
}

module.exports = { buildMacroHealth };

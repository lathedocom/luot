// FILE: script_bot/modules/market/macro_health.js

const HEALTH_CATEGORIES = {
    'chi_phi': { name: 'Chi phí sinh hoạt', icon: '🛒', inverse: true, keywords: ['lạm phát', 'giá cả', 'xăng', 'điện', 'cpi', 'thực phẩm', 'heo hơi'], market_keys: ['CPI_VN', 'RON95', 'GOLD_SJC', 'RICE_VN'] },
    'viec_lam': { name: 'Thị trường việc làm', icon: '💼', inverse: false, keywords: ['thất nghiệp', 'tuyển dụng', 'việc làm', 'lương', 'sa thải'], market_keys: ['UNEMP_VN'] },
    'san_xuat': { name: 'Sản xuất & Công nghiệp', icon: '🏭', inverse: false, keywords: ['pmi', 'nhà máy', 'sản xuất', 'công nghiệp', 'đơn hàng'], market_keys: ['PMI_VN', 'IIP_VN'] },
    'thuong_mai': { name: 'Thương mại & XNK', icon: '🚢', inverse: false, keywords: ['xuất khẩu', 'nhập khẩu', 'container', 'cảng', 'logistics'], market_keys: ['EXPORT_VN', 'IMPORT_VN'] },
    'xay_dung': { name: 'Xây dựng & Bất động sản', icon: '🏗️', inverse: false, keywords: ['bất động sản', 'xây dựng', 'xi măng', 'thép', 'cát', 'giá nhà'], market_keys: ['STEEL_CB300', 'CEMENT', 'SAND'] },
    'nong_nghiep': { name: 'Nông nghiệp & Hàng hóa', icon: '🌾', inverse: false, keywords: ['gạo', 'cà phê', 'hồ tiêu', 'cao su', 'dầu', 'khí đốt'], market_keys: ['BRENT', 'GOLD_W', 'COFFEE_VN', 'PEPPER_VN'] },
    'tien_te': { name: 'Tiền tệ & Tín dụng', icon: '💰', inverse: false, keywords: ['lãi suất', 'tỷ giá', 'tín dụng', 'ngân hàng', 'usd'], market_keys: ['USD_VND', 'DXY', 'INTERBANK_RATE'] },
    'tai_chinh': { name: 'Thị trường tài chính', icon: '📈', inverse: false, keywords: ['chứng khoán', 'cổ phiếu', 'trái phiếu', 'vnindex'], market_keys: ['VNINDEX', 'SP500', 'BTC'] },
    'rui_ro': { name: 'Rủi ro toàn cầu', icon: '🌍', inverse: true, keywords: ['khủng hoảng', 'chiến tranh', 'đảo chính', 'căng thẳng', 'dịch bệnh'], market_keys: [] }
};

// Khởi tạo các phân tích mẫu dựa trên Trạng thái (Tích cực / Tiêu cực)
function getInsightDetails(key, finalScore) {
    const isBad = finalScore < -19;
    let target = '', duration = 'Trung hạn', meaning = '';

    switch(key) {
        case 'chi_phi':
            target = 'Người tiêu dùng, Hộ gia đình';
            meaning = isBad ? 'Thực phẩm, đi lại đắt đỏ hơn. Nguy cơ phải thắt chặt chi tiêu.' : 'Áp lực giá cả ổn định, dễ thở hơn cho người dân.';
            duration = 'Ngắn & Trung hạn'; break;
        case 'viec_lam':
            target = 'Người lao động, Sinh viên mới ra trường';
            meaning = isBad ? 'Tìm việc khó khăn hơn, cạnh tranh gay gắt, thu nhập chững lại.' : 'Nhiều cơ hội việc làm mở ra, dễ thỏa thuận lương.';
            duration = 'Trung & Dài hạn'; break;
        case 'tien_te':
            target = 'Doanh nghiệp vay vốn, Người mua nhà, Du học sinh';
            meaning = isBad ? 'Chi phí vay vốn tăng, hàng nhập khẩu đắt đỏ hơn.' : 'Lãi suất dễ chịu, thuận lợi cho việc vay mượn mở rộng kinh doanh.';
            duration = 'Trung hạn'; break;
        case 'san_xuat':
            target = 'Doanh nghiệp sản xuất, Công nhân';
            meaning = isBad ? 'Nhà máy thiếu đơn hàng, có nguy cơ phải giảm giờ làm hoặc cắt giảm nhân sự.' : 'Nhà máy hoạt động hết công suất, nhu cầu tuyển dụng tăng cao.';
            break;
        case 'thuong_mai':
            target = 'Doanh nghiệp xuất nhập khẩu, Logistics';
            meaning = isBad ? 'Hàng hóa khó xuất ngoại, chi phí vận tải có thể biến động.' : 'Đơn hàng quốc tế tăng, dòng tiền ngoại tệ đổ về tích cực.';
            break;
        case 'xay_dung':
            target = 'Người mua nhà, Nhà thầu xây dựng';
            meaning = isBad ? 'Chi phí vật liệu tăng cao đẩy giá nhà lên, giao dịch trầm lắng.' : 'Vật liệu bình ổn, nhiều dự án được tái khởi động.';
            duration = 'Dài hạn'; break;
        case 'nong_nghiep':
            target = 'Nông dân, Doanh nghiệp chế biến thực phẩm';
            meaning = isBad ? 'Chi phí phân bón tăng, giá bán nông sản rớt gây khó khăn cho nông dân.' : 'Nông sản được giá, lợi nhuận ngành nông nghiệp khởi sắc.';
            break;
        case 'tai_chinh':
            target = 'Nhà đầu tư cá nhân, Quỹ đầu tư';
            meaning = isBad ? 'Tài sản bốc hơi, tâm lý phòng thủ bao trùm thị trường.' : 'Kênh đầu tư sinh lời tốt, tâm lý thị trường hưng phấn.';
            duration = 'Ngắn hạn'; break;
        case 'rui_ro':
            target = 'Hầu hết mọi người (Tác động gián tiếp)';
            meaning = isBad ? 'Chuỗi cung ứng có thể đứt gãy, giá dầu và vàng dễ biến động mạnh.' : 'Tình hình địa chính trị êm dịu, dòng vốn đầu tư an tâm giải ngân.';
            break;
    }
    return { target, meaning, duration };
}

function buildMacroHealth(topics, marketData = []) {
    const now = Date.now();
    const results = [];
    const recentTopics = topics.filter(t => (now - (t.timestamp || now)) <= 7 * 24 * 60 * 60 * 1000);

    for (const [key, category] of Object.entries(HEALTH_CATEGORIES)) {
        let finalScore = 0, dataScore = 0, newsScore = 0;
        let reasons = [];

        // 1. Quét Dữ liệu Market
        const relatedMarkets = marketData.filter(m => category.market_keys.includes(m.id) && m.status !== 'offline');
        if (relatedMarkets.length > 0) {
            let totalChange = 0;
            relatedMarkets.forEach(m => {
                const change = m.raw_change || 0;
                totalChange += change;
                if (Math.abs(change) > 1 || m.type === 'macro') {
                    const directionText = change > 0 ? 'tăng' : 'giảm';
                    reasons.push(`${m.name} ${directionText} ${Math.abs(change).toFixed(1)} ${m.unit === '%' ? 'điểm %' : ''}`);
                }
            });
            dataScore = Math.max(-100, Math.min(100, ((totalChange / relatedMarkets.length) / 5) * 100));
            if (category.inverse) dataScore = -dataScore;
        }

        // 2. Quét Tin tức tổng hợp
        const relatedTopics = recentTopics.filter(t => category.keywords.some(kw => (t.title + ' ' + (t.short_summary || '')).toLowerCase().includes(kw)));
        if (relatedTopics.length > 0) {
            let totalNewsImpact = 0;
            relatedTopics.forEach(t => {
                const sentiment = t.sentiment !== undefined ? t.sentiment : 0; 
                totalNewsImpact += sentiment * (t.severity || 2) * 20;
            });
            newsScore = Math.max(-100, Math.min(100, totalNewsImpact / relatedTopics.length));
            relatedTopics.sort((a, b) => (b.severity || 0) - (a.severity || 0));
            if (relatedTopics[0].severity >= 3) reasons.push(relatedTopics[0].title);
        }

        // Tỷ trọng: 60% Dữ liệu, 40% Tin tức
        finalScore = relatedMarkets.length > 0 ? (dataScore * 0.6) + (newsScore * 0.4) : newsScore;

        // 3. Quy đổi Trạng thái
        let status = 'Bình thường', color = '#3b82f6', trendIcon = '→';
        let impactLevel = '🟢 Thấp';

        if (finalScore >= 60) { status = 'Cải thiện mạnh'; color = '#10b981'; trendIcon = '↑'; impactLevel = '🔴 Cao (Tích cực)'; }
        else if (finalScore >= 20) { status = 'Đang cải thiện'; color = '#10b981'; trendIcon = '↑'; impactLevel = '🟡 Trung bình'; }
        else if (finalScore >= -19) { status = 'Bình thường / Ổn định'; color = '#facc15'; trendIcon = '→'; impactLevel = '🟢 Thấp'; }
        else if (finalScore >= -59) { status = 'Có dấu hiệu suy yếu'; color = '#f97316'; trendIcon = '↓'; impactLevel = '🟡 Trung bình'; }
        else { status = 'Suy yếu mạnh'; color = '#ef4444'; trendIcon = '↓'; impactLevel = '🔴 Cao'; }

        if (category.inverse) {
            if (finalScore <= -60) { status = 'Áp lực tăng rất cao'; impactLevel = '🔴 Cao'; }
            else if (finalScore <= -20) { status = 'Có dấu hiệu tăng'; impactLevel = '🟡 Trung bình'; }
            else if (finalScore >= 20) { status = 'Đang hạ nhiệt'; impactLevel = '🟢 Thấp'; }
        }

        const insight = getInsightDetails(key, finalScore);
        const uniqueReasons = [...new Set(reasons)].slice(0, 3);
        if (uniqueReasons.length === 0) uniqueReasons.push("Dữ liệu duy trì ổn định theo chu kỳ.");

        results.push({
            id: key, name: category.name, icon: category.icon, score: finalScore,
            status: status, color: color, trend_icon: trendIcon,
            reasons: uniqueReasons,
            target_audience: insight.target, meaning: insight.meaning,
            impact_level: impactLevel, duration: insight.duration
        });
    }

    return results;
}

module.exports = { buildMacroHealth };

// FILE: script_bot/modules/market/market_analyzer.js
const { getHistoricalData } = require('./history/history_manager');

// Tính trung bình trượt (Moving Average)
function calculateMovingAverage(dataPoints, periods = 3) {
    if (!dataPoints || dataPoints.length === 0) return 0;
    const recent = dataPoints.slice(-periods);
    const sum = recent.reduce((a, b) => a + (b.value || 0), 0);
    return sum / recent.length;
}

/**
 * Nối số liệu với Tin tức & Format cho Giao diện UI
 */
function linkMarketWithNews(currentDb, recentTopics) {
    const analyzedResults = [];
    const fullHistory = getHistoricalData(6); // Lấy 6 tháng/kỳ gần nhất

    for (const [id, currentData] of Object.entries(currentDb)) {
        let isAnomaly = false;
        let matchedContext = null;
        let trend = "→";
        let changePercentVal = 0;

        const symbolHistory = fullHistory[id] || [];
        
        // 1. TÍNH TOÁN BIẾN ĐỘNG VÀ BẤT THƯỜNG
        if (symbolHistory.length >= 2) {
            const prevData = symbolHistory[symbolHistory.length - 2];
            const ma3 = calculateMovingAverage(symbolHistory, 3);
            
            // So với kỳ ngay trước đó
            if (prevData && prevData.value > 0) {
                changePercentVal = ((currentData.value - prevData.value) / prevData.value) * 100;
                if (changePercentVal > 0) trend = "↑";
                else if (changePercentVal < 0) trend = "↓";
            }

            // Tìm bất thường so với MA3
            if (ma3 > 0) {
                const changeFromMA = ((currentData.value - ma3) / ma3) * 100;
                if (Math.abs(changeFromMA) > 5) { // Ngưỡng bất thường giả định: 5%
                    isAnomaly = true;
                }
            }
        }

        // 2. TÌM TIN TỨC LIÊN QUAN (NEWS CONTEXT)
        if (isAnomaly) {
            const bestMatch = recentTopics.find(t => 
                (t.title || "").toLowerCase().includes(currentData.name.toLowerCase())
            );

            if (bestMatch) {
                matchedContext = {
                    event_title: bestMatch.title,
                    causes: bestMatch.causes ? bestMatch.causes.slice(0, 2) : [],
                    news_summary: bestMatch.short_summary
                };
            }
        }

        // 3. FORMAT CHO GIAO DIỆN (UI SCHEMA)
        // Trích xuất mảng dữ liệu cho biểu đồ Chart.js
        const historyPrices = symbolHistory.map(h => h.value);
        const historyLabels = symbolHistory.map(h => {
            const d = new Date(h.timestamp);
            return currentData.frequency === 'monthly' 
                ? `T${d.getMonth() + 1}` 
                : `${d.getDate()}/${d.getMonth() + 1}`;
        });

        // Định dạng giá trị hiển thị (Có dấu phẩy phân cách)
        const displayPrice = currentData.value !== null 
            ? parseFloat(currentData.value.toFixed(2)).toLocaleString('vi-VN') 
            : null;

        const displayChange = (changePercentVal > 0 ? '+' : '') + parseFloat(changePercentVal.toFixed(2)) + '%';

        // Phân loại nhóm (Category) dựa trên cấu hình cũ để UI nhận diện lưới
        let categoryGroup = "Thị trường chung";
        if (id.includes("cpi") || id.includes("ron95") || id.includes("sjc")) categoryGroup = "💰 Chi phí sinh hoạt";
        else if (id.includes("usd") || id.includes("interbank")) categoryGroup = "🏦 Tiền tệ";
        else if (id.includes("index") || id.includes("btc")) categoryGroup = "📈 Thị trường tài chính";

        analyzedResults.push({
            id: currentData.indicator_id,
            name: currentData.name,
            category: categoryGroup,
            type: currentData.frequency,
            unit: currentData.unit,
            price: displayPrice,
            change_percent: displayChange,
            trend: trend,
            history: historyPrices.length > 0 ? historyPrices : [currentData.value],
            history_labels: historyLabels.length > 0 ? historyLabels : ['Hiện tại'],
            updated_at: new Date(currentData.retrieved_at).getTime(),
            display_source: currentData.source.name,
            status: currentData.quality.status === "failed" ? "offline" : "online",
            is_alert: isAnomaly,
            context: matchedContext
        });
    }

    return analyzedResults;
}

module.exports = { linkMarketWithNews };

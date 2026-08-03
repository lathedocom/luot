// FILE: script_bot/modules/market/market_analyzer.js
const { getHistoricalData } = require('./history/history_manager');

// Hàm tính trung bình trượt (Moving Average)
function calculateMovingAverage(dataPoints, periods = 3) {
    if (!dataPoints || dataPoints.length === 0) return 0;
    const recent = dataPoints.slice(-periods);
    const sum = recent.reduce((a, b) => a + b.value, 0);
    return sum / recent.length;
}

// Nối số liệu với Tin tức (Phase 5)
function linkMarketWithNews(currentDb, recentTopics) {
    const analyzedResults = [];
    const fullHistory = getHistoricalData(6); // Lấy lịch sử 6 tháng để tính toán

    for (const [id, currentData] of Object.entries(currentDb)) {
        let isAnomaly = false;
        let matchedContext = null;
        let trend = "→";

        // 1. Tính toán Xu hướng (Phase 4)
        const symbolHistory = fullHistory[id] || [];
        const ma3 = calculateMovingAverage(symbolHistory, 3);
        
        if (ma3 > 0) {
            const changePercent = ((currentData.value - ma3) / ma3) * 100;
            
            if (changePercent > 3) trend = "↑";
            else if (changePercent < -3) trend = "↓";

            // Giả sử ngưỡng bất thường là > 5%
            if (Math.abs(changePercent) > 5) {
                isAnomaly = true;
            }
        }

        // 2. Map tin tức nếu có bất thường (Phase 5)
        if (isAnomaly) {
            // Logic quét `recentTopics` để tìm bài báo nhắc đến "CPI" hoặc "Xăng" giống như file cũ của bạn
            const bestMatch = recentTopics.find(t => 
                (t.title || "").toLowerCase().includes(currentData.name.toLowerCase())
            );

            if (bestMatch) {
                matchedContext = {
                    event_title: bestMatch.title,
                    news_summary: bestMatch.short_summary
                };
            }
        }

        analyzedResults.push({
            ...currentData,
            trend,
            is_anomaly: isAnomaly,
            news_context: matchedContext
        });
    }

    return analyzedResults;
}

module.exports = { linkMarketWithNews };

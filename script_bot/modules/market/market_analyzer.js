// FILE: script_bot/modules/market/market_analyzer.js

function linkMarketWithNews(marketDataArray, currentTopics) {
    return marketDataArray.map(item => {
        const changeValue = Math.abs(parseFloat(item.change_percent));
        
        // Mặc định là Tầng 1 (Chỉ số bình thường)
        item.is_alert = false;
        item.context = null;

        // KÍCH HOẠT TẦNG 2 & 3: Nếu biến động vượt ngưỡng cảnh báo
        if (changeValue >= item.threshold) {
            item.is_alert = true;

            // Tìm kiếm sự kiện giải thích (Nguyên nhân & Tác động) trong DB Tin tức
            // Ưu tiên các sự kiện vĩ mô (value_score cao) có chứa keyword của mã này
            const matchingTopic = currentTopics.find(topic => {
                const topicText = `${topic.title} ${topic.detailed_summary} ${topic.causes?.join(' ')}`.toLowerCase();
                return item.keywords.some(kw => topicText.includes(kw.toLowerCase()));
            });

            if (matchingTopic) {
                item.context = {
                    event_title: matchingTopic.title,
                    causes: matchingTopic.causes ? matchingTopic.causes.slice(0, 2) : [],
                    market_impact: matchingTopic.market_impact || "Thị trường đang phản ứng mạnh với tin tức này."
                };
            }
        }
        return item;
    });
}

module.exports = { linkMarketWithNews };

function linkMarketWithNews(marketDataArray, currentTopics) {
    return marketDataArray.map(item => {
        const changeValue = Math.abs(item.raw_change);
        
        item.is_alert = false;
        item.context = null;

        // Nếu biến động vượt ngưỡng cảnh báo thiết lập trong config
        if (changeValue >= item.threshold) {
            item.is_alert = true;

            // Dò tìm Topic vĩ mô gần nhất (trong 48h) có chứa keyword của thị trường
            const recentTopics = currentTopics.filter(t => (Date.now() - t.timestamp) < 48 * 60 * 60 * 1000);
            
            const matchingTopic = recentTopics.find(topic => {
                const topicText = `${topic.title} ${topic.detailed_summary} ${topic.causes?.join(' ')}`.toLowerCase();
                return item.keywords.some(kw => topicText.includes(kw.toLowerCase()));
            });

            if (matchingTopic) {
                item.context = {
                    event_title: matchingTopic.title,
                    causes: matchingTopic.causes ? matchingTopic.causes.slice(0, 2) : [],
                    market_impact: matchingTopic.market_impact || "Thị trường đang phản ứng mạnh với diễn biến này."
                };
            }
        }
        
        // Dọn dẹp object trước khi lưu
        delete item.api_source;
        delete item.api_symbol;
        delete item.raw_change;
        delete item.threshold;
        delete item.keywords;

        return item;
    });
}

module.exports = { linkMarketWithNews };

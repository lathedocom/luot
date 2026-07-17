/**
 * Module này không trực tiếp đọc file, nó nhận object Topic và xử lý mảng Timeline bên trong.
 * Giúp người dùng thấy được diễn biến: 24h trước có gì, hôm nay có gì.
 */

function addEventToTimeline(topic, newActionTitle, newTimestamp, articleUrl) {
    // Khởi tạo mảng timeline nếu chưa có
    if (!topic.timeline) {
        topic.timeline = [];
    }

    // Tránh thêm các tình tiết bị trùng lặp thời gian hoặc tiêu đề
    const isDuplicate = topic.timeline.some(item => 
        item.title === newActionTitle || 
        item.url === articleUrl
    );

    if (!isDuplicate) {
        topic.timeline.push({
            title: newActionTitle,
            timestamp: newTimestamp,
            url: articleUrl
        });

        // Sắp xếp timeline theo thứ tự thời gian mới nhất lên đầu
        topic.timeline.sort((a, b) => b.timestamp - a.timestamp);

        // Giữ lại tối đa 5 mốc sự kiện quan trọng nhất để không làm phình to dữ liệu
        if (topic.timeline.length > 5) {
            topic.timeline = topic.timeline.slice(0, 5);
        }
    }
    
    return topic;
}

module.exports = { addEventToTimeline };

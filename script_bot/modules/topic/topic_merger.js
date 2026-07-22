const { addEventToTimeline } = require('./timeline_manager');

/**
 * Nếu hệ thống tìm thấy sự kiện này đã có trong file (trùng event_key),
 * thay vì tạo bản tin mới và gọi AI phân tích lại từ đầu (tốn Quota),
 * ta chỉ gộp thêm bài báo mới vào nguồn tham khảo và đẩy lên đầu trang.
 */
function mergeIntoExistingTopic(existingTopic, newArticles, newActionTitle) {
    let updatedTopic = { ...existingTopic };

    // SỬA: Chuẩn hoá publish_time về timestamp số (ms) trước khi so sánh,
    // tránh Math.max() nhận chuỗi ISO date gây NaN
    const toTimestamp = (t) => {
        if (!t) return Date.now();
        const ms = new Date(t).getTime();
        return isNaN(ms) ? Date.now() : ms;
    };

    const latestArticleTime = Math.max(...newArticles.map(a => toTimestamp(a.publish_time)));

    // 1. Cập nhật thời gian mới nhất cho Cụm
    updatedTopic.timestamp = latestArticleTime;

    // 2. Gộp thêm nguồn bài báo mới (Tránh trùng lặp URL)
    const existingUrls = new Set(updatedTopic.sources.map(s => s.url));
    newArticles.forEach(article => {
        if (!existingUrls.has(article.url)) {
            updatedTopic.sources.push({
                url: article.url,
                source_name: article.source_name,
                source_logo: article.source_logo
            });
            existingUrls.add(article.url);
        }
    });

    // 3. Tăng điểm Hot Score vì sự kiện tiếp tục có báo đưa tin
    updatedTopic.hot_score = (updatedTopic.hot_score || 0) + (newArticles.length * 5);

    // 4. Thêm tình tiết mới vào Timeline
    if (newArticles.length > 0) {
        updatedTopic = addEventToTimeline(
            updatedTopic,
            newActionTitle || newArticles[0].title,
            latestArticleTime,
            newArticles[0].url
        );
    }
    return updatedTopic;
}

module.exports = { mergeIntoExistingTopic };

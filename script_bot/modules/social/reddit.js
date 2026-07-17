const logger = require('../utils/logger');

/**
 * Lấy các bài đăng Top Trending từ chuyên mục World News của Reddit
 */
async function fetchRedditTrends() {
    try {
        // Gọi API công khai của Reddit (Lấy top 3 bài hot nhất)
        const response = await fetch('https://www.reddit.com/r/worldnews/top.json?limit=3');
        const data = await response.json();
        
        const trends = data.data.children.map(post => ({
            platform: 'Reddit',
            icon: 'https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-57x57.png',
            content: post.data.title,
            url: `https://www.reddit.com${post.data.permalink}`,
            trend_icon: '🔥',
            time: Date.now()
        }));

        return trends;
    } catch (error) {
        logger.error('Lỗi khi lấy dữ liệu từ Reddit Plugin', error);
        return [];
    }
}

module.exports = { fetchRedditTrends };

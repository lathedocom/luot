const logger = require('../utils/logger');

/**
 * Lấy các bài đăng Top Trending từ chuyên mục World News của Reddit
 */
async function fetchRedditTrends() {
    try {
        // Đeo mặt nạ trình duyệt Chrome để không bị Reddit chặn bot
        const response = await fetch('https://www.reddit.com/r/worldnews/top.json?limit=3', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Mã lỗi Reddit: ${response.status}`);
        }

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

// FILE: script_bot/modules/social/reddit.js
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { REDDIT_SUBREDDITS_TO_WATCH } = require('../../config/social_sources');

const CACHE_FILE = path.join(__dirname, '../../data/cache_reddit.json');

function initCache() {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, JSON.stringify([]));
}

// Hàm sinh User-Agent ngẫu nhiên để tránh bị nhận diện là Bot
function getRandomUserAgent() {
    const chromeVersion = Math.floor(Math.random() * 20) + 100; // Random bản Chrome từ 100 - 120
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36 LuotSocialBot/1.0`;
}

async function fetchRedditTrends() {
    if (!REDDIT_SUBREDDITS_TO_WATCH || REDDIT_SUBREDDITS_TO_WATCH.length === 0) return [];

    initCache();
    let cachedIds = new Set(JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')));
    const newTrends = [];

    logger.info(`[Reddit] Đang quét ${REDDIT_SUBREDDITS_TO_WATCH.length} subreddits...`);

    // Khởi tạo Parser với cấu hình Timeout an toàn
    const parser = new Parser({ timeout: 15000 });

    for (const sub of REDDIT_SUBREDDITS_TO_WATCH) {
        try {
            // Thay đổi headers linh động trong mỗi lượt Request
            const feedUrl = `https://www.reddit.com/r/${sub.name}/top.rss?t=day`;
            
            // Ép rss-parser dùng thư viện HTTP nội bộ kèm headers tự chế
            const feed = await parser.parseURL(feedUrl, {
                headers: { 'User-Agent': getRandomUserAgent() }
            });
            
            // Chỉ lấy tối đa 3 tin top đầu mỗi subreddit để tránh làm loãng widget
            const topItems = feed.items.slice(0, 3);

            for (const item of topItems) {
                const itemId = item.id || item.link;
                if (!itemId || cachedIds.has(itemId)) continue;

                newTrends.push({
                    keyword: sub.label,
                    summary: item.title, // Tiêu đề Reddit thường chứa đủ thông tin
                    source: 'reddit',
                    url: item.link,
                    timestamp: item.pubDate ? new Date(item.pubDate).getTime() : Date.now()
                });

                cachedIds.add(itemId);
            }
        } catch (error) {
            logger.warn(`[Reddit] Bỏ qua r/${sub.name} (Lỗi: ${error.message})`);
        }
        
        // BẮT BUỘC: Ngủ 4 giây giữa các request để vượt qua Rate Limit (Lỗi 429) của Reddit
        await new Promise(resolve => setTimeout(resolve, 4000));
    }

    let updatedCache = Array.from(cachedIds);
    if (updatedCache.length > 1500) updatedCache = updatedCache.slice(-1500);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(updatedCache, null, 2));

    logger.info(`[Reddit] Thu thập thành công ${newTrends.length} thảo luận trending.`);
    return newTrends;
}

module.exports = { fetchRedditTrends };

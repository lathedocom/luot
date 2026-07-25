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

async function fetchRedditTrends() {
    if (!REDDIT_SUBREDDITS_TO_WATCH || REDDIT_SUBREDDITS_TO_WATCH.length === 0) return [];

    initCache();
    let cachedIds = new Set(JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')));
    const newTrends = [];

    // CHIẾN LƯỢC CHIA NHỎ: Trộn ngẫu nhiên và chỉ lấy 6 subreddits mỗi lần chạy (chạy 4 lần/ngày = 24 sub)
    const shuffledSubreddits = [...REDDIT_SUBREDDITS_TO_WATCH].sort(() => 0.5 - Math.random());
    const targetSubreddits = shuffledSubreddits.slice(0, 6);

    logger.info(`[Reddit] Đang quét ${targetSubreddits.length} subreddits ngẫu nhiên (Chiến lược chống 429)...`);

    for (const sub of targetSubreddits) {
        try {
            // CHIẾN LƯỢC MINH BẠCH: Khai báo User-Agent chuẩn theo yêu cầu của Reddit
            const parser = new Parser({
                timeout: 15000,
                headers: { 
                    'User-Agent': 'LuotNewsBot/4.5 (by u/admin)' 
                }
            });

            const feedUrl = `https://www.reddit.com/r/${sub.name}/top.rss?t=day`;
            const feed = await parser.parseURL(feedUrl);
            
            if (!feed || !feed.items || feed.items.length === 0) continue;

            const topItems = feed.items.slice(0, 3);

            for (const item of topItems) {
                const itemId = item.id || item.link;
                if (!itemId || cachedIds.has(itemId)) continue;

                newTrends.push({
                    keyword: sub.label,
                    summary: item.title, 
                    source: 'reddit',
                    url: item.link,
                    timestamp: item.pubDate ? new Date(item.pubDate).getTime() : Date.now()
                });

                cachedIds.add(itemId);
            }
        } catch (error) {
            logger.warn(`[Reddit] Bỏ qua r/${sub.name} (Lỗi: ${error.message})`);
        }
        
        // CHIẾN LƯỢC DELAY: Chờ 5 giây trước khi gọi sub tiếp theo
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    let updatedCache = Array.from(cachedIds);
    if (updatedCache.length > 1500) updatedCache = updatedCache.slice(-1500);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(updatedCache, null, 2));

    logger.info(`[Reddit] Thu thập thành công ${newTrends.length} thảo luận trending.`);
    return newTrends;
}

module.exports = { fetchRedditTrends };

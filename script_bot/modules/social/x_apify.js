// FILE: script_bot/modules/social/x_apify.js
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { API_KEYS } = require('../../config/models');
const { X_ACCOUNTS_TO_WATCH } = require('../../config/social_sources');

const CACHE_FILE = path.join(__dirname, '../../data/cache_x_tweets.json');

// Khởi tạo thư mục và file cache nếu chưa có
function initCache() {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, JSON.stringify([]));
}

async function fetchXTweets() {
    if (!API_KEYS.APIFY_API_TOKEN) {
        logger.warn('[X-Apify] Bỏ qua cào X vì thiếu APIFY_API_TOKEN.');
        return [];
    }

    if (!X_ACCOUNTS_TO_WATCH || X_ACCOUNTS_TO_WATCH.length === 0) return [];

    initCache();
    let cachedTweetIds = new Set(JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')));
    const newTrends = [];

    // GIẢ ĐỊNH: Dùng Actor "quacker/twitter-scraper" (giá rẻ ~$0.15/1000 tweet).
    // Nếu bạn chọn Actor khác, vui lòng đổi ACTOR_ID và cấu trúc input cho phù hợp.
    const ACTOR_ID = 'quacker~twitter-scraper';
    const API_URL = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${API_KEYS.APIFY_API_TOKEN}`;

    const handles = X_ACCOUNTS_TO_WATCH.map(acc => acc.handle);
    const inputPayload = {
        twitterHandles: handles,
        maxItems: 15 // Giới hạn số lượng nghiêm ngặt cho mỗi tài khoản để giữ ngân sách $5/tháng
    };

    try {
        logger.info(`[X-Apify] Đang gọi Apify lấy tweet cho ${handles.length} tài khoản...`);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inputPayload)
        });

        if (!response.ok) {
            throw new Error(`Apify trả về mã lỗi: ${response.status}`);
        }

        const tweets = await response.json();
        
        for (const tweet of tweets) {
            const tweetId = tweet.id || tweet.url;
            if (!tweetId || cachedTweetIds.has(tweetId)) continue;

            const accountLabel = X_ACCOUNTS_TO_WATCH.find(a => 
                a.handle.toLowerCase() === (tweet.author?.userName || tweet.user?.screen_name || '').toLowerCase()
            )?.label || tweet.author?.name || 'X User';

            const summaryStr = (tweet.text || tweet.full_text || '').substring(0, 300);

            newTrends.push({
                keyword: accountLabel,
                summary: summaryStr,
                source: 'x',
                url: tweet.url
            });

            cachedTweetIds.add(tweetId);
        }

        // Lưu cache, giữ tối đa 1000 ID gần nhất để tránh phình to file
        let updatedCache = Array.from(cachedTweetIds);
        if (updatedCache.length > 1000) updatedCache = updatedCache.slice(-1000);
        fs.writeFileSync(CACHE_FILE, JSON.stringify(updatedCache, null, 2));

        logger.info(`[X-Apify] Thu thập thành công ${newTrends.length} tweet mới.`);
        return newTrends;

    } catch (error) {
        logger.warn(`[X-Apify] Lỗi khi lấy dữ liệu từ Apify: ${error.message}`);
        return [];
    }
}

module.exports = { fetchXTweets };

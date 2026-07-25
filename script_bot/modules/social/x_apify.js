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

    // Cập nhật đúng ID Actor của Kaito (Apify API dùng dấu ~ thay cho dấu /)
    const ACTOR_ID = 'kaitoeasyapi~twitter-x-data-tweet-scraper-pay-per-result-cheapest';
    const API_URL = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${API_KEYS.APIFY_API_TOKEN}`;

    // Cấu trúc Input JSON tương thích với Actor Kaito
    const searchTerms = X_ACCOUNTS_TO_WATCH.map(acc => `from:${acc.handle}`);
    const inputPayload = {
        searchTerms: searchTerms,
        queryType: "Latest",
        maxItems: 15 // Giữ giới hạn để bảo vệ ngân sách
    };

    try {
        logger.info(`[X-Apify] Đang gọi Apify (Kaito Actor) lấy tweet mới nhất cho ${searchTerms.length} tài khoản...`);
        
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
            const tweetId = tweet.id || tweet.url || tweet.tweet_id;
            if (!tweetId || cachedTweetIds.has(tweetId)) continue;

            // Actor Kaito có thể trả về tên field hơi khác, quét diện rộng để lấy đúng username
            const authorHandle = (tweet.author?.userName || tweet.user?.screen_name || tweet.username || tweet.screen_name || '').toLowerCase();
            
            const accountLabel = X_ACCOUNTS_TO_WATCH.find(a => 
                a.handle.toLowerCase() === authorHandle
            )?.label || tweet.author?.name || tweet.name || 'X User';

            const summaryStr = (tweet.text || tweet.full_text || tweet.content || '').substring(0, 300);

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

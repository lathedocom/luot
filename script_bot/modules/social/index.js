// FILE: script_bot/modules/social/index.js
const logger = require('../utils/logger');
const { fetchXTweets } = require('./x_apify');
const { fetchTelegramNews } = require('./telegram_scraper');
const { fetchRedditTrends } = require('./reddit');
const { fetchYoutubeTrends } = require('./youtube');

async function fetchAllSocialTrends() {
    logger.info("[Social] Khởi động luồng OSINT: Thu thập Mạng Xã Hội (X, Telegram, Reddit, YouTube)...");

    try {
        // Dùng Promise.allSettled để đảm bảo lỗi ở 1 nguồn không đánh sập toàn bộ
        const results = await Promise.allSettled([
            fetchXTweets(),
            fetchTelegramNews(),
            fetchRedditTrends(),
            fetchYoutubeTrends()
        ]);

        let combinedTrends = [];

        results.forEach((result, index) => {
            const moduleNames = ['X-Apify', 'Telegram', 'Reddit', 'YouTube'];
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                combinedTrends = combinedTrends.concat(result.value);
            } else if (result.status === 'rejected') {
                logger.warn(`[Social] Module ${moduleNames[index]} thất bại: ${result.reason}`);
            }
        });

        // Sắp xếp dữ liệu từ mới nhất đến cũ nhất trước khi lưu vào file JSON
        combinedTrends.sort((a, b) => {
            const timeA = a.timestamp || a.time || 0;
            const timeB = b.timestamp || b.time || 0;
            return timeB - timeA;
        });

        logger.info(`[Social] Tổng hợp hoàn tất ${combinedTrends.length} tín hiệu OSINT mới.`);
        
        return combinedTrends;

    } catch (error) {
        logger.error(`[Social] Lỗi nghiêm trọng khi điều phối Social: ${error.message}`);
        return []; // Trả về mảng rỗng để không làm hỏng pipeline tin tức cốt lõi
    }
}

module.exports = { fetchAllSocialTrends };

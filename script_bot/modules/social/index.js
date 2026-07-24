// FILE: script_bot/modules/social/index.js
const logger = require('../utils/logger');
const { fetchXTweets } = require('./x_apify');
const { fetchTelegramNews } = require('./telegram_scraper');
// Nếu bạn có file reddit.js, youtube.js cũ thì có thể import vào đây
// Ví dụ: const { fetchRedditTrends } = require('./reddit');

async function fetchAllSocialTrends() {
    logger.info("[Social] Khởi động luồng thu thập Mạng Xã Hội...");

    try {
        // Dùng Promise.allSettled để đảm bảo lỗi ở 1 nguồn không đánh sập toàn bộ
        const results = await Promise.allSettled([
            fetchXTweets(),
            fetchTelegramNews()
            // fetchRedditTrends() // Uncomment nếu có module cũ
        ]);

        let combinedTrends = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                combinedTrends = combinedTrends.concat(result.value);
            } else if (result.status === 'rejected') {
                logger.warn(`[Social] Một module thu thập MXH thất bại (Index: ${index}): ${result.reason}`);
            }
        });

        // Xáo trộn nhẹ hoặc sắp xếp theo thời gian/ưu tiên nếu cần, ở đây trả về mảng phẳng
        logger.info(`[Social] Tổng hợp hoàn tất ${combinedTrends.length} xu hướng MXH mới.`);
        
        return combinedTrends;

    } catch (error) {
        logger.error(`[Social] Lỗi nghiêm trọng khi điều phối Social: ${error.message}`);
        return []; // Trả về mảng rỗng để không làm hỏng pipeline
    }
}

module.exports = { fetchAllSocialTrends };

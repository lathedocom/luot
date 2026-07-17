const { ENABLED_PLATFORMS } = require('../../config/social');
const { fetchRedditTrends } = require('./reddit');
const { fetchYouTubeTrends } = require('./youtube');
const logger = require('../utils/logger');

/**
 * Quét file config/social.js, plugin nào đang bật (true) thì mới được phép chạy.
 * Gộp tất cả xu hướng MXH lại thành một mảng duy nhất.
 */
async function fetchAllSocialTrends() {
    logger.info('Đang tổng hợp Nhịp đập Mạng xã hội...');
    
    const activePlugins = [];

    // Chỉ đẩy các hàm fetch vào mảng chạy nếu Config cho phép bật
    if (ENABLED_PLATFORMS.REDDIT) activePlugins.push(fetchRedditTrends());
    if (ENABLED_PLATFORMS.YOUTUBE) activePlugins.push(fetchYouTubeTrends());
    
    // [TODO]: Sau này tạo thêm file tiktok.js, facebook.js thì import và thêm if() vào đây

    if (activePlugins.length === 0) {
        logger.warn('Không có plugin MXH nào đang bật.');
        return [];
    }

    // Chạy song song toàn bộ plugin đang bật
    const results = await Promise.allSettled(activePlugins);
    let allTrends = [];

    results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            // Nối mảng kết quả của từng platform vào mảng tổng
            allTrends = allTrends.concat(result.value);
        }
    });

    logger.success(`Đã thu thập được ${allTrends.length} luồng thảo luận MXH.`);
    return allTrends;
}

module.exports = { fetchAllSocialTrends };

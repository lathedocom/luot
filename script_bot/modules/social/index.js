const { ENABLED_PLATFORMS } = require('../../config/social');
const { fetchRedditTrends } = require('./reddit');
const { fetchYouTubeTrends } = require('./youtube');
const logger = require('../utils/logger');
const { getCache, setCache } = require('../cache/cache_manager');

async function fetchAllSocialTrends() {
    logger.info('Đang tổng hợp Nhịp đập Mạng xã hội...');
    
    // 1. Kiểm tra Cache (TTL 60 phút cho MXH)
    const cachedData = getCache('social_cache', 'latest_social');
    if (cachedData) {
        logger.info('⚡ [Cache Hit] Trả về dữ liệu MXH từ Bộ đệm Cache');
        return cachedData;
    }

    const activePlugins = [];
    if (ENABLED_PLATFORMS.REDDIT) activePlugins.push(fetchRedditTrends());
    if (ENABLED_PLATFORMS.YOUTUBE) activePlugins.push(fetchYouTubeTrends());
    
    if (activePlugins.length === 0) {
        logger.warn('Không có plugin MXH nào đang bật.');
        return [];
    }
    
    // 2. Gọi song song
    const results = await Promise.allSettled(activePlugins);
    let allTrends = [];
    results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            allTrends = allTrends.concat(result.value);
        }
    });
    
    // 3. Lưu Cache
    setCache('social_cache', 'latest_social', allTrends, 60);
    logger.success(`Đã thu thập được ${allTrends.length} luồng thảo luận MXH và lưu Cache.`);
    
    return allTrends;
}

module.exports = { fetchAllSocialTrends };

const logger = require('../utils/logger');
const { getCache, setCache } = require('../cache/cache_manager');
const { fetchAllLiveMarketData } = require('./market_fetcher');
const { linkMarketWithNews } = require('./market_analyzer');

async function fetchAllMarketData(currentTopics = []) {
    logger.info('Đang tổng hợp và phân tích dữ liệu Thị trường (Live API)...');
    
    // 1. Kiểm tra Cache (TTL 15 phút cho Market)
    const cachedData = getCache('market_cache', 'latest_market');
    if (cachedData) {
        logger.info('⚡ [Cache Hit] Trả về dữ liệu Thị trường từ Bộ đệm Cache');
        return cachedData;
    }
    
    // 2. Fetch API trực tiếp từ Yahoo & Binance
    const rawMarketData = await fetchAllLiveMarketData();
    
    if (!rawMarketData || rawMarketData.length === 0) {
        logger.warn('Không lấy được dữ liệu thị trường từ các API Public.');
        return [];
    }

    // 3. Chạy Knowledge Graph: Gắn kết biến động giá với News Context
    const enrichedMarketData = linkMarketWithNews(rawMarketData, currentTopics);
    
    // 4. Lưu Cache
    setCache('market_cache', 'latest_market', enrichedMarketData, 15);
    logger.success(`Đã cập nhật thành công ${enrichedMarketData.length} mã thị trường (Kèm Context).`);
    
    return enrichedMarketData;
}

module.exports = { fetchAllMarketData };

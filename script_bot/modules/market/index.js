const { fetchCryptoData } = require('./crypto');
const { fetchGoldData } = require('./gold');
const { fetchCurrencyData } = require('./currency');
const { fetchStocksData } = require('./stocks');
const logger = require('../utils/logger');
const { getCache, setCache } = require('../cache/cache_manager');

async function fetchAllMarketData() {
    logger.info('Đang tổng hợp dữ liệu Thị trường...');
    
    // 1. Kiểm tra Cache trước (TTL 30 phút để tránh cào API liên tục)
    const cachedData = getCache('market_cache', 'latest_market');
    if (cachedData) {
        logger.info('⚡ [Cache Hit] Trả về dữ liệu Thị trường từ Bộ đệm Cache');
        return cachedData;
    }

    // 2. Nếu Cache hết hạn, tiến hành gọi API thật
    const results = await Promise.allSettled([
        fetchCryptoData(),
        fetchGoldData(),
        fetchCurrencyData(),
        fetchStocksData()
    ]);
    
    const marketData = [];
    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value !== null) {
            marketData.push(result.value);
        }
    });
    
    // 3. Ghi đè vào Cache
    setCache('market_cache', 'latest_market', marketData, 30);
    logger.success(`Đã lấy thành công ${marketData.length} mã thị trường và lưu Cache.`);
    
    return marketData;
}

module.exports = { fetchAllMarketData };

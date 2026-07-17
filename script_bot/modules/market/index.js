const { fetchCryptoData } = require('./crypto');
const { fetchGoldData } = require('./gold');
const { fetchCurrencyData } = require('./currency');
const { fetchStocksData } = require('./stocks');
const logger = require('../utils/logger');

/**
 * Gọi tất cả các API thị trường cùng một lúc.
 * Dùng Promise.allSettled để đảm bảo: Nếu 1 cái sập, các cái khác vẫn chạy bình thường.
 */
async function fetchAllMarketData() {
    logger.info('Đang tổng hợp dữ liệu Thị trường...');
    
    const results = await Promise.allSettled([
        fetchCryptoData(),
        fetchGoldData(),
        fetchCurrencyData(),
        fetchStocksData()
    ]);

    const marketData = [];

    results.forEach(result => {
        // Chỉ lấy những API gọi thành công và có dữ liệu trả về
        if (result.status === 'fulfilled' && result.value !== null) {
            marketData.push(result.value);
        }
    });

    logger.success(`Đã lấy thành công ${marketData.length} mã thị trường.`);
    return marketData;
}

module.exports = { fetchAllMarketData };

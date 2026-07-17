const logger = require('../utils/logger');

/**
 * Gọi API thật của Binance để lấy giá Bitcoin (BTC)
 */
async function fetchCryptoData() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
        const data = await response.json();
        
        const price = parseFloat(data.lastPrice);
        const changePercent = parseFloat(data.priceChangePercent);
        
        return {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: price.toFixed(2),
            change_percent: changePercent.toFixed(2) + '%',
            trend: changePercent >= 0 ? '↑' : '↓',
            updated_at: Date.now()
        };
    } catch (error) {
        logger.error('Lỗi khi lấy dữ liệu Crypto từ Binance', error);
        return null;
    }
}

module.exports = { fetchCryptoData };

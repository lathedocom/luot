const logger = require('../utils/logger');

/**
 * Khung chuẩn bị sẵn để lấy chỉ số VN-Index
 */
async function fetchStocksData() {
    try {
        // [TODO]: Cắm API chứng khoán (VD: SSI, VNDirect, hoặc TCBS public API)
        return {
            symbol: 'VNINDEX',
            name: 'VN-Index',
            price: '1280.15',
            change_percent: '+1.2%',
            trend: '↑',
            updated_at: Date.now()
        };
    } catch (error) {
        logger.error('Lỗi khi lấy dữ liệu Chứng khoán', error);
        return null;
    }
}

module.exports = { fetchStocksData };

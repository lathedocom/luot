const logger = require('../utils/logger');

/**
 * Khung chuẩn bị sẵn để lấy tỷ giá USD/VND
 */
async function fetchCurrencyData() {
    try {
        // [TODO]: Thay thế bằng API tỷ giá ngân hàng thật (VD: Vietcombank API hoặc Exchangerate-API)
        return {
            symbol: 'USD/VND',
            name: 'Tỷ giá Đô la',
            price: '25450',
            change_percent: '-0.1%',
            trend: '↓',
            updated_at: Date.now()
        };
    } catch (error) {
        logger.error('Lỗi khi lấy dữ liệu Tỷ giá', error);
        return null;
    }
}

module.exports = { fetchCurrencyData };

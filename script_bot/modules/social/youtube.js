const logger = require('../utils/logger');

/**
 * Khung chuẩn bị sẵn để lấy xu hướng Video ngắn/Tin tức từ YouTube
 */
async function fetchYouTubeTrends() {
    try {
        // [TODO]: Cắm API YouTube Data v3 thực tế vào đây
        // Tạm thời trả về dữ liệu mô phỏng để Frontend có dữ liệu render
        return [
            {
                platform: 'YouTube',
                icon: 'https://www.youtube.com/s/desktop/114cbab0/img/favicon.ico',
                content: 'Tin nóng: Cập nhật tình hình kinh tế vĩ mô quý 3',
                url: 'https://youtube.com',
                trend_icon: '📈',
                time: Date.now()
            }
        ];
    } catch (error) {
        logger.error('Lỗi khi lấy dữ liệu từ YouTube Plugin', error);
        return [];
    }
}

module.exports = { fetchYouTubeTrends };

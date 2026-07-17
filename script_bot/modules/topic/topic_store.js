const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Trỏ file lưu trữ ra thư mục gốc dự án (ngang hàng với script_bot)
const DATA_FILE_PATH = path.join(__dirname, '../../../news_data.json');

/**
 * Đọc toàn bộ dữ liệu từ file JSON hiện tại
 */
function readData() {
    try {
        if (fs.existsSync(DATA_FILE_PATH)) {
            const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
            return JSON.parse(rawData);
        }
    } catch (error) {
        logger.error('Lỗi khi đọc file news_data.json', error);
    }
    
    // Trả về cấu trúc mặc định nếu file chưa có hoặc bị lỗi
    return {
        schema_version: "2.0",
        generated_at: Date.now(),
        pipeline_version: "2.0",
        statistics: {},
        market_data: [],
        daily_briefing: {},
        social_trends: [],
        news: []
    };
}

/**
 * Ghi đè dữ liệu mới vào file JSON
 */
function writeData(dataObject) {
    try {
        dataObject.generated_at = Date.now(); // Luôn cập nhật thời gian mới nhất
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(dataObject, null, 2), 'utf-8');
        logger.success('Đã lưu dữ liệu thành công vào news_data.json');
        return true;
    } catch (error) {
        logger.error('Lỗi khi ghi dữ liệu vào news_data.json', error);
        return false;
    }
}

/**
 * Tìm kiếm một Topic cũ dựa trên event_key
 */
function findTopicByEventKey(eventKey, newsArray) {
    if (!newsArray) return null;
    return newsArray.find(topic => topic.event_key === eventKey);
}

module.exports = {
    readData,
    writeData,
    findTopicByEventKey
};

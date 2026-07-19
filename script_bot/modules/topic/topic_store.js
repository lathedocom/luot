const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const DATA_FILE_PATH = path.join(__dirname, '../../../news_data.json');

function readData() {
    try {
        if (fs.existsSync(DATA_FILE_PATH)) {
            const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
            return JSON.parse(rawData);
        }
    } catch (error) {
        logger.error('Lỗi khi đọc file news_data.json', error);
    }
    
    return {
        schema_version: "4.5",
        generated_at: Date.now(),
        pipeline_version: "4.5",
        statistics: {},
        market_data: [],
        daily_briefing: {},
        social_trends: [],
        news: [] // Đây chính là Existing Topics
    };
}

function writeData(dataObject) {
    try {
        dataObject.generated_at = Date.now(); 
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(dataObject, null, 2), 'utf-8');
        logger.success('Đã lưu dữ liệu thành công vào news_data.json');
        return true;
    } catch (error) {
        logger.error('Lỗi khi ghi dữ liệu vào news_data.json', error);
        return false;
    }
}

function findTopicByEventKey(eventKey, newsArray) {
    if (!newsArray) return null;
    return newsArray.find(topic => topic.event_key === eventKey);
}

module.exports = {
    readData,
    writeData,
    findTopicByEventKey
};

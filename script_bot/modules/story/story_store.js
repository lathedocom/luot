const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const TIMELINE_DATA_PATH = path.join(__dirname, '../../../timeline_data.json');

function readTimelineData() {
    try {
        if (fs.existsSync(TIMELINE_DATA_PATH)) {
            return JSON.parse(fs.readFileSync(TIMELINE_DATA_PATH, 'utf-8'));
        }
    } catch (error) {
        logger.error('Lỗi khi đọc file timeline_data.json', error);
    }
    
    return {
        schema_version: "1.0",
        last_updated: Date.now(),
        stories: []
    };
}

function writeTimelineData(dataObject) {
    try {
        dataObject.last_updated = Date.now(); 
        fs.writeFileSync(TIMELINE_DATA_PATH, JSON.stringify(dataObject, null, 2), 'utf-8');
        return true;
    } catch (error) {
        logger.error('Lỗi khi ghi dữ liệu vào timeline_data.json', error);
        return false;
    }
}

module.exports = { readTimelineData, writeTimelineData };

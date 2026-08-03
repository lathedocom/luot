// FILE: script_bot/modules/market/history/history_manager.js
const fs = require('fs');
const path = require('path');

const MARKET_DATA_DIR = path.join(__dirname, '../../../../data/market');
const HISTORY_DIR = path.join(MARKET_DATA_DIR, 'history');

// Đảm bảo cấu trúc thư mục tồn tại
if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR, { recursive: true });

function saveToHistory(collectedDataArray) {
    const currentFile = path.join(MARKET_DATA_DIR, 'current.json');
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const historyFile = path.join(HISTORY_DIR, `${monthKey}.json`);

    // 1. Đọc dữ liệu hiện tại
    let currentDb = {};
    if (fs.existsSync(currentFile)) {
        currentDb = JSON.parse(fs.readFileSync(currentFile, 'utf8'));
    }

    // 2. Đọc file lịch sử tháng hiện tại
    let historyDb = [];
    if (fs.existsSync(historyFile)) {
        historyDb = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }

    // 3. Xử lý và ghi đè dữ liệu mới
    collectedDataArray.forEach(data => {
        // Bỏ qua nếu dữ liệu lỗi
        if (data.quality.status === 'failed' || data.value === null) return;

        // Cập nhật current.json (Trạng thái mới nhất)
        currentDb[data.indicator_id] = data;

        // Thêm vào history log (để theo dõi trend)
        historyDb.push({
            id: data.indicator_id,
            value: data.value,
            period: data.period || now.toISOString().split('T')[0],
            timestamp: data.retrieved_at
        });
    });

    // 4. Lưu file
    fs.writeFileSync(currentFile, JSON.stringify(currentDb, null, 2));
    fs.writeFileSync(historyFile, JSON.stringify(historyDb, null, 2));

    return { currentDb, historyDb };
}

// Hàm hỗ trợ Analyzer lấy dữ liệu N tháng gần nhất
function getHistoricalData(monthsBack = 6) {
    // Logic đọc các file YYYY-MM.json trong thư mục history
    // Gom lại thành một mảng dữ liệu chuỗi thời gian để tính Moving Average
    // ... (Code ghép file json)
    return {}; 
}

module.exports = { saveToHistory, getHistoricalData };

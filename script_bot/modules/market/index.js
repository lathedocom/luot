// FILE: script_bot/modules/market/index.js
const { runCollector } = require('./collector');
const { saveToHistory } = require('./history/history_manager');
const { linkMarketWithNews } = require('./market_analyzer');
const { buildMacroHealth } = require('./macro_health');
const logger = require('../utils/logger');

/**
 * Trạm điều phối chính cho tính năng Thị trường
 * @param {string} frequency - Chu kỳ cào (vd: 'daily', 'monthly', 'event')
 * @param {Array} currentTopics - Dữ liệu tin tức 7 ngày gần nhất
 */
async function processMarketRoutine(frequency = "daily", currentTopics = []) {
    logger.info(`[Market Routine] Khởi chạy chu kỳ: ${frequency}`);

    // PHASE 1 & 2: THU THẬP VÀ KIỂM ĐỊNH
    // Tự động phân luồng cào dựa theo tần suất. (Ví dụ: 0 đồng/GitHub Actions)
    const collectedData = await runCollector(frequency);
    
    if (collectedData.length === 0) {
        logger.info(`Không có chỉ số nào cần thu thập trong chu kỳ ${frequency}.`);
        return null;
    }

    // PHASE 3: LƯU TRỮ LỊCH SỬ (HISTORY)
    const { currentDb } = saveToHistory(collectedData);

    // PHASE 4 & 5: PHÂN TÍCH VÀ GẮN BỐI CẢNH TIN TỨC
    const analyzedMarketData = linkMarketWithNews(currentDb, currentTopics);

    // PHASE 6 & 7 & 8: ĐÁNH GIÁ SỨC KHỎE VĨ MÔ & AI GIẢI THÍCH
    // Ép AI giải thích theo công thức điểm số (File bạn đã sửa ở bước trước)
    const macroHealthData = await buildMacroHealth(currentTopics, analyzedMarketData);

    logger.success(`[Market Routine] Hoàn tất chu kỳ ${frequency}.`);

    return {
        market_board: analyzedMarketData,
        macro_health: macroHealthData
    };
}

module.exports = { processMarketRoutine };

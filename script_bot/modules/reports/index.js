const logger = require('../utils/logger');
const { generateDailyBriefing } = require('./daily');
const { generateWeeklyBriefing } = require('./weekly');
const { generateMonthlyBriefing } = require('./monthly');

/**
 * Hàm điều phối việc sinh báo cáo.
 * Mặc định Cron Job chạy 4 lần/ngày sẽ luôn sinh Daily.
 * Nếu hôm nay là Chủ Nhật -> Sinh thêm Weekly.
 * Nếu hôm nay là ngày cuối tháng -> Sinh thêm Monthly.
 */
async function generateAllReports(allTopics) {
    logger.info("Bắt đầu kiểm tra và sinh Báo cáo định kỳ...");
    
    const reports = {};
    const today = new Date();

    // 1. Luôn sinh báo cáo ngày
    reports.daily = await generateDailyBriefing(allTopics);

    // 2. Kiểm tra nếu là Chủ Nhật (0 là Chủ nhật trong JS)
    if (today.getDay() === 0) {
        logger.info("Hôm nay là Chủ Nhật, kích hoạt sinh Báo cáo Tuần.");
        reports.weekly = await generateWeeklyBriefing(allTopics);
    }

    // 3. Kiểm tra nếu là ngày cuối cùng của tháng
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getDate() === 1) {
        logger.info("Hôm nay là ngày cuối tháng, kích hoạt sinh Báo cáo Tháng.");
        reports.monthly = await generateMonthlyBriefing(allTopics);
    }

    return reports;
}

module.exports = { generateAllReports };

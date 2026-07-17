const logger = require('../utils/logger');
const { buildSummaryPrompt } = require('./summary');
const { buildImpactPrompt } = require('./impact');

/**
 * Hàm mô phỏng việc gọi API tới Google Gemini (Sẽ được tích hợp logic fetch thật sau).
 * Ở phiên bản kiến trúc này, ta tách biệt hàm tạo Prompt và hàm gọi API.
 * 
 * @param {string} prompt - Kịch bản đã được build từ các file summary.js / impact.js
 * @returns {object} - Dữ liệu JSON đã parse
 */
async function callAIModel(prompt) {
    // [TODO]: Logic fetch tới https://generativelanguage.googleapis.com
    // Có sử dụng quota_manager.js để kiểm tra Rate Limit
    // Tạm thời trả về object rỗng chờ bước ghép nối Pipeline
    return {}; 
}

/**
 * Orchestrator xử lý phân tích AI đa luồng cho 1 cụm Topic
 */
async function analyzeTopicMultiDimensional(combinedText) {
    logger.info("Bắt đầu gọi AI phân tích đa chiều cho Topic...");
    
    try {
        // Mẹo tối ưu: Thay vì gọi 1 cục to, ta gọi 2 request nhỏ song song.
        // Prompt càng ngắn, AI xử lý càng nhanh và tỷ lệ lỗi JSON càng thấp.
        const [summaryResult, impactResult] = await Promise.all([
            callAIModel(buildSummaryPrompt(combinedText)),
            callAIModel(buildImpactPrompt(combinedText))
        ]);

        return {
            ...summaryResult,
            ...impactResult
        };
    } catch (error) {
        logger.error("Lỗi trong quá trình phân tích AI đa chiều", error);
        return {
            short_summary: "Không thể tóm tắt do lỗi hệ thống.",
            detailed_summary: "",
            causes: [],
            effects: [],
            affected_groups: [],
            follow_up: "Vui lòng thử lại sau."
        };
    }
}

module.exports = { analyzeTopicMultiDimensional };

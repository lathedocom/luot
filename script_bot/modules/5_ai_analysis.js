const fs = require('fs');
const path = require('path');
const { getAiResult, saveAiResult } = require('./cache/ai_cache');
const gateway = require('./ai/gateway');
const logger = require('./utils/logger');

const PROMPT_DEEP_ANALYSIS = fs.readFileSync(path.join(__dirname, '../prompts/deep_analysis.md'), 'utf8');
const SCHEMA_TOPIC = fs.readFileSync(path.join(__dirname, '../schemas/topic.schema.json'), 'utf8');

async function analyzeClusterMultiDimensional(cluster, eventKey) {
    const cachedResult = getAiResult(eventKey);
    if (cachedResult) {
        logger.info(`⚡ [Cache Hit] Sử dụng lại kết quả AI cho Event: ${eventKey}`);
        return cachedResult;
    }

    const prompt = PROMPT_DEEP_ANALYSIS.replace('{{COMBINED_TEXT}}', cluster.combined_text) + `\n\nCẤU TRÚC JSON YÊU CẦU:\n${SCHEMA_TOPIC}`;
    
    let aiResponse = null;
    let success = false;

    try {
        // GỌI QUA GATEWAY (GIAI ĐOẠN 3) - Code cực kỳ gọn gàng!
        aiResponse = await gateway.executeGeneration('DEEP_ANALYSIS', prompt);
        success = true;
    } catch (error) {
        logger.error(`Phân tích AI thất bại hoàn toàn: ${error.message}`);
    }

    const finalTopicAnalysis = {
        cluster_title: success ? (aiResponse.cluster_title || "Sự kiện vĩ mô tổng hợp") : cluster.articles[0].title,
        short_summary: success ? (aiResponse.short_summary || "Chưa có tóm tắt cốt lõi.") : cluster.articles[0].summary,
        detailed_summary: success ? (aiResponse.detailed_summary || "Chi tiết sự kiện đang được cập nhật thêm.") : cluster.combined_text.substring(0, 200) + "...",
        causes: success && Array.isArray(aiResponse.causes) ? aiResponse.causes : ["Đang cập nhật dữ liệu bối cảnh"],
        effects: success && Array.isArray(aiResponse.effects) ? aiResponse.effects : ["Đang phân tích chuỗi hệ quả"],
        affected_groups: success && Array.isArray(aiResponse.affected_groups) ? aiResponse.affected_groups : ["Cộng đồng người dùng hệ thống"],
        market_impact: success ? (aiResponse.market_impact || "Chưa có ghi nhận tác động tài chính rõ rệt.") : "Đang theo dõi biến động thị trường.",
        follow_up: success ? (aiResponse.follow_up || "Theo dõi các cổng thông tin chính thức.") : "Chờ cập nhật tình tiết mới từ các báo."
    };

    saveAiResult(eventKey, finalTopicAnalysis);
    await new Promise(resolve => setTimeout(resolve, 4000));
    return finalTopicAnalysis;
}

module.exports = { analyzeClusterMultiDimensional };

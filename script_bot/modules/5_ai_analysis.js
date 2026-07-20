const fs = require('fs');
const path = require('path');
const { getAiResult, saveAiResult } = require('./cache/ai_cache');
const gateway = require('./ai/gateway');
const logger = require('./utils/logger');

// Vẫn giữ prompt chi tiết Tầng 2 để Gemini phân tích
const PROMPT_DEEP_ANALYSIS = fs.readFileSync(path.join(__dirname, '../prompts/deep_analysis.md'), 'utf8');

async function analyzeClusterMultiDimensional(cluster, eventKey) {
    const cachedResult = getAiResult(eventKey);
    if (cachedResult) {
        logger.info(`⚡ [Cache Hit] Sử dụng lại kết quả AI cho Event: ${eventKey}`);
        return cachedResult;
    }
    
    let finalTopicAnalysis = {};
    
    try {
        logger.info(`[Phân tích] Bắt đầu gọi AI Tầng 1 (Gemma) cho sự kiện: ${eventKey}`);
        
        // --- TẦNG 1: Gọi Gemma để kiểm tra Metadata & Đánh giá có cần phân tích sâu không ---
        const metadataPrompt = `Trích xuất thông tin từ khối dữ liệu tin tức thô sau đây:
"${cluster.combined_text}"

LỆNH TUYỆT ĐỐI: CHỈ TRẢ VỀ JSON VỚI CÁC TRƯỜNG SAU:
{
  "event": "Tên sự kiện ngắn gọn",
  "keywords": ["từ khóa 1", "từ khóa 2"],
  "entities": ["thực thể 1", "thực thể 2"],
  "region": "Khu vực chính",
  "category": ["Danh mục 1", "Danh mục 2"],
  "importance": 85,
  "need_deep_analysis": true/false (chỉ true nếu sự kiện có tính chất vĩ mô, phức tạp, tác động lớn),
  "short_summary": "Tóm tắt 30-50 từ"
}`;
        
        const gemmaResult = await gateway.executeTask('EXTRACT_METADATA', metadataPrompt);
        
        // --- TẦNG 2: Gọi Gemini (Chỉ khi Gemma xác nhận need_deep_analysis = true) ---
        if (gemmaResult && gemmaResult.need_deep_analysis) {
            logger.info(`[Phân tích] Gemma đánh giá CẦN phân tích sâu. Đang gọi Tầng 2 (Gemini)...`);
            
            const deepPrompt = PROMPT_DEEP_ANALYSIS.replace('{{COMBINED_TEXT}}', cluster.combined_text) + `\n\nCẤU TRÚC JSON YÊU CẦU: Chỉ trả về JSON gồm { "causes", "effects", "affected_groups", "market_impact", "follow_up", "detailed_summary" }. Không kèm \`\`\`json.`;
            
            const geminiResult = await gateway.executeTask('DEEP_ANALYSIS', deepPrompt);
            
            // Gộp dữ liệu Tầng 1 và Tầng 2
            finalTopicAnalysis = { 
                cluster_title: gemmaResult.event || cluster.articles[0].title,
                short_summary: gemmaResult.short_summary || cluster.articles[0].summary,
                detailed_summary: geminiResult.detailed_summary || "Chi tiết đang cập nhật.",
                causes: Array.isArray(geminiResult.causes) ? geminiResult.causes : [],
                effects: Array.isArray(geminiResult.effects) ? geminiResult.effects : [],
                affected_groups: Array.isArray(geminiResult.affected_groups) ? geminiResult.affected_groups : [],
                market_impact: geminiResult.market_impact || "",
                follow_up: geminiResult.follow_up || "",
                entities: gemmaResult.entities || [],
                keywords: gemmaResult.keywords || [],
                importance: gemmaResult.importance || cluster.articles[0].importance
            };
        } else {
            logger.info(`[Phân tích] Gemma đánh giá sự kiện NGẮN, không cần Tầng 2.`);
            
            // Không cần AI Tầng 2, tự sinh thông tin cơ bản
            finalTopicAnalysis = {
                cluster_title: gemmaResult.event || cluster.articles[0].title,
                short_summary: gemmaResult.short_summary || cluster.articles[0].summary,
                detailed_summary: "Sự kiện nhỏ hoặc mang tính cập nhật nhanh, không yêu cầu phân tích chuyên sâu.",
                causes: [], 
                effects: [], 
                affected_groups: [], 
                market_impact: "", 
                follow_up: "",
                entities: gemmaResult.entities || [],
                keywords: gemmaResult.keywords || [],
                importance: gemmaResult.importance || cluster.articles[0].importance
            };
        }
    } catch (error) {
        logger.error(`Phân tích AI thất bại hoàn toàn: ${error.message}`);
        // Chế độ dự phòng khi lỗi mạng
        finalTopicAnalysis = {
            cluster_title: cluster.articles[0].title,
            short_summary: cluster.articles[0].summary,
            detailed_summary: cluster.combined_text.substring(0, 200) + "...",
            causes: ["Đang cập nhật dữ liệu bối cảnh"],
            effects: ["Đang phân tích chuỗi hệ quả"],
            affected_groups: ["Cộng đồng người dùng hệ thống"],
            market_impact: "Đang theo dõi biến động thị trường.",
            follow_up: "Chờ cập nhật tình tiết mới từ các báo."
        };
    }

    saveAiResult(eventKey, finalTopicAnalysis);
    await new Promise(resolve => setTimeout(resolve, 5000));
    return finalTopicAnalysis;
}

module.exports = { analyzeClusterMultiDimensional };

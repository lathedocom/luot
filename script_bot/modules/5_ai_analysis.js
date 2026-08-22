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
        const metadataPrompt = `Trích xuất thông tin từ khối dữ liệu tin tức thô sau đây (có thể là tiếng nước ngoài):
"${cluster.combined_text}"

[ĐÁNH GIÁ PHẠM VI ẢNH HƯỞNG - SCOPE]
Dựa vào nội dung, hãy phân loại tác động của sự kiện vào 1 trong 4 mức (chỉ trả về text tiếng Anh):
- personal: Chỉ ảnh hưởng cá nhân, giới showbiz, sự việc đơn lẻ.
- business: Ảnh hưởng một ngành nghề, chuỗi cung ứng, doanh nghiệp cụ thể.
- national: Tác động đến chính trị, kinh tế, xã hội của một quốc gia.
- global: Ảnh hưởng toàn cầu, đa quốc gia, kinh tế vĩ mô.
[ĐÁNH GIÁ TÍNH CHẤT SỰ KIỆN]
- severity: Mức độ nghiêm trọng/quan trọng từ 1 đến 5 (1: Nhỏ/Bình thường, 3: Đáng chú ý/Hợp tác quốc gia, 5: Thảm họa/Xung đột lớn/Đột phá lịch sử).
- sentiment: 1 (Tích cực: Ngoại giao, hợp tác, đầu tư, cứu trợ, tăng trưởng), 0 (Trung lập: Thông báo, chính sách chung), -1 (Tiêu cực: Xung đột, trừng phạt, phá sản, bắt giữ, thiên tai).
LƯU Ý BẮT BUỘC: Trường "event" và "short_summary" PHẢI viết bằng Tiếng Việt chuẩn mực.
LƯU Ý ĐẶC BIỆT: Nếu bản tin nhắc đến các doanh nghiệp, ngân hàng, hoặc tổ chức của Việt Nam (Ví dụ: Vietjet, Hòa Phát, Vingroup, HDBank, FPT, Vietcombank...), BẮT BUỘC trường "regions" phải chứa "VN" và "vn_impact" phải phản ánh tình hình kinh doanh, lợi nhuận hoặc sự phát triển của doanh nghiệp đó. Tuyệt đối không được ghi "Không tác động trực tiếp"
LỆNH TUYỆT ĐỐI: CHỈ TRẢ VỀ JSON VỚI CÁC TRƯỜNG SAU:
{
  "event": "Tên sự kiện ngắn gọn",
  "keywords": ["từ khóa 1", "từ khóa 2"],
  "entities": ["thực thể 1", "thực thể 2"],
  "regions": ["Mã ISO quốc gia (VD: VN, US, JP, GLOBAL)"],
  "categories": ["Danh mục 1", "Danh mục 2"],
  "importance": 85,
  "scope": "personal | business | national | global",
  "severity": 3,
  "sentiment": -1,
  "vn_impact": "Đánh giá nhanh tác động tới Việt Nam (Nếu không có, ghi: Không tác động trực tiếp đến Việt Nam.)",
 "need_deep_analysis": true/false (BẮT BUỘC trả về true nếu sự kiện liên quan đến: chiến tranh, địa chính trị, tài chính, giao thương, kinh tế vĩ mô quốc tế, ngân hàng trung ương, các tập đoàn lớn, biến động thị trường hoặc chính sách quốc gia. CHỈ trả về false đối với tin showbiz, cá nhân, thể thao, hoặc tin nội bộ doanh nghiệp nhỏ),
  "short_summary": "Tóm tắt 30-50 từ"
}`;
        
        const gemmaResult = await gateway.executeTask('EXTRACT_METADATA', metadataPrompt);
        
        // --- TẦNG 2: Gọi Gemini (Chỉ khi Gemma xác nhận need_deep_analysis = true) ---
        if (gemmaResult && gemmaResult.need_deep_analysis) {
            logger.info(`[Phân tích] Gemma đánh giá CẦN phân tích sâu. Đang gọi Tầng 2 (Gemini)...`);
            
            const deepPrompt = PROMPT_DEEP_ANALYSIS.replace('{{COMBINED_TEXT}}', cluster.combined_text);
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
                
                // [ĐÃ SỬA] Nhận vn_impact từ Tầng 2
                vn_impact: geminiResult.vn_impact || "Không tác động trực tiếp đến Việt Nam.",
                
                follow_up: geminiResult.follow_up || "",

                categories: Array.isArray(geminiResult.categories) ? geminiResult.categories : (Array.isArray(gemmaResult.categories) ? gemmaResult.categories : []),
                regions: Array.isArray(geminiResult.regions) ? geminiResult.regions : (Array.isArray(gemmaResult.regions) ? gemmaResult.regions : []),
                
                significance: geminiResult.significance || "",
                unknowns: Array.isArray(geminiResult.unknowns) ? geminiResult.unknowns : [],
                confidence_note: geminiResult.confidence_note || "",
                scenarios: Array.isArray(geminiResult.scenarios) ? geminiResult.scenarios : [],
                entity_relations: Array.isArray(geminiResult.entity_relations) ? geminiResult.entity_relations : [],
                entities: gemmaResult.entities || [],
                keywords: gemmaResult.keywords || [],
                importance: gemmaResult.importance || cluster.articles[0].importance,
                severity: gemmaResult.severity || 3,
                sentiment: gemmaResult.sentiment !== undefined ? gemmaResult.sentiment : 0,
                scope: gemmaResult.scope || geminiResult.scope || "business"
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
                
                // [ĐÃ SỬA] Bổ sung 3 trường thiếu vào khối else
                vn_impact: gemmaResult.vn_impact || "Không tác động trực tiếp đến Việt Nam.",
                categories: Array.isArray(gemmaResult.categories) ? gemmaResult.categories : [],
                regions: Array.isArray(gemmaResult.regions) ? gemmaResult.regions : [],

                follow_up: "",
                entities: gemmaResult.entities || [],
                keywords: gemmaResult.keywords || [],
                importance: gemmaResult.importance || cluster.articles[0].importance,
                severity: gemmaResult.severity || 3,
                sentiment: gemmaResult.sentiment !== undefined ? gemmaResult.sentiment : 0,
                scope: gemmaResult.scope || "business"
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
            vn_impact: "Không thể đánh giá tác động do lỗi AI.",
            categories: [],
            regions: [],
            follow_up: "Chờ cập nhật tình tiết mới từ các báo.",
            scope: "business",
            importance: 50
        };
    }
    
    saveAiResult(eventKey, finalTopicAnalysis);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return finalTopicAnalysis;
}

module.exports = { analyzeClusterMultiDimensional };

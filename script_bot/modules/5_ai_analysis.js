require('dotenv').config();
const { Groq } = require('groq-sdk');
const { getAiResult, saveAiResult } = require('./cache/ai_cache');
const quotaManager = require('./quota/quota_manager');
const configModels = require('../config/models');
const logger = require('./utils/logger');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

/**
 * Phân tích đa chiều cho một cụm sự kiện (Topic).
 * Kiểm tra Cache trước, ưu tiên Gemini 3.1 Flash Lite, Fallback sang Groq hoặc Rule-based mặc định.
 */
async function analyzeClusterMultiDimensional(cluster, eventKey) {
    // 1. Kiểm tra bộ nhớ đệm Cache để đưa chi phí về 0
    const cachedResult = getAiResult(eventKey);
    if (cachedResult) {
        logger.info(`⚡ [Cache Hit] Sử dụng lại kết quả AI cho Event: ${eventKey}`);
        return cachedResult;
    }

    const apiKey = (configModels.API_KEYS.GEMINI || '').trim();
    const modelName = 'gemini-3.1-flash-lite'; // Model tối ưu 500 RPD[cite: 1]
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const prompt = `
Bạn là một chuyên gia phân tích tin tức tình báo cao cấp. Đọc khối dữ liệu tin tức thô sau đây:
"${cluster.combined_text}"

Nhiệm vụ của bạn là tổng hợp và phân tích đa chiều sự kiện này theo cấu trúc yêu cầu.
LỆNH TUYỆT ĐỐI: CHỈ TRẢ VỀ ĐÚNG MỘT OBJECT JSON THEO CẤU TRÚC SAU. KHÔNG ĐƯỢC CHÈN BẤT KỲ VĂN BẢN GIẢI THÍCH NÀO KHÁC NGOÀI JSON.

{
  "cluster_title": "Tiêu đề tiếng Việt mang tính thời sự vĩ mô, ngắn gọn dưới 15 từ",
  "short_summary": "Tóm tắt sự việc cốt lõi diễn ra trong 40 từ",
  "detailed_summary": "Phân tích diễn biến chi tiết và logic nội tại của sự kiện khoảng 80 từ",
  "causes": ["Nguyên nhân cốt lõi 1", "Nguyên nhân cốt lõi 2"],
  "effects": ["Hệ quả trực tiếp 1", "Hệ quả trực tiếp 2"],
  "affected_groups": ["Nhóm đối tượng/ngành nghề bị ảnh hưởng chính 1", "Nhóm 2"],
  "market_impact": "Tác động cụ thể đến kinh tế, tài chính, thị trường hoặc giá cả tài sản (nếu có, khoảng 30 từ)",
  "follow_up": "Điểm mấu chốt cần tiếp tục theo dõi sát sao trong vài ngày tới (1 câu ngắn gọn)"
}`;

    let aiResponse = null;
    let success = false;

    // THỬ NGHIỆM 1: Gọi Gemini 3.1 Flash Lite
    if (apiKey) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (response.status === 429) {
                logger.warn(`Gemini API dính Rate Limit (429). Không retry, chuẩn bị chuyển hướng Fallback.`);
            } else if (response.ok) {
                const data = await response.json();
                if (data.candidates && data.candidates[0].content.parts[0].text) {
                    let responseText = data.candidates[0].content.parts[0].text;
                    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                    aiResponse = JSON.parse(responseText);
                    quotaManager.recordUsage(modelName, 1200);
                    success = true;
                }
            }
        } catch (err) {
            logger.error(`Lỗi kết nối Gemini API: ${err.message}`);
        }
    }

    // THỬ NGHIỆM 2: Cứu cánh bằng Groq nếu Gemini thất bại hoặc hết hạn mức
    if (!success && groq) {
        try {
            logger.info("Kích hoạt tầng cứu cánh Groq (Llama-3.1)...");
            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.1-8b-instant",
                temperature: 0.1,
                response_format: { type: "json_object" }
            });
            let responseText = chatCompletion.choices[0].message.content;
            aiResponse = JSON.parse(responseText.trim());
            success = true;
        } catch (groqErr) {
            logger.error(`Lỗi cả chốt chặn Groq: ${groqErr.message}`);
        }
    }

    // XỬ LÝ KẾT QUẢ CUỐI CÙNG
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

    // Lưu kết quả vào Cache để tái sử dụng trọn đời sự kiện
    saveAiResult(eventKey, finalTopicAnalysis);
    
    // Giãn cách nhẹ 500ms giữa các cụm để bảo vệ RPM an toàn
    await new Promise(resolve => setTimeout(resolve, 500));

    return finalTopicAnalysis;
}

module.exports = { analyzeClusterMultiDimensional };

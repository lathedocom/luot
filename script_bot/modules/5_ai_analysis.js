require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Groq } = require('groq-sdk');
const { getAiResult, saveAiResult } = require('./cache/ai_cache');
const quotaManager = require('./quota/quota_manager');
const configModels = require('../config/models');
const logger = require('./utils/logger');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// ĐỌC PROMPT VÀ SCHEMA TỪ FILE TĨNH (GIAI ĐOẠN 1)
const PROMPT_DEEP_ANALYSIS = fs.readFileSync(path.join(__dirname, '../../prompts/deep_analysis.md'), 'utf8');
const SCHEMA_TOPIC = fs.readFileSync(path.join(__dirname, '../../schemas/topic.schema.json'), 'utf8');

async function analyzeClusterMultiDimensional(cluster, eventKey) {
    const cachedResult = getAiResult(eventKey);
    if (cachedResult) {
        logger.info(`⚡ [Cache Hit] Sử dụng lại kết quả AI cho Event: ${eventKey}`);
        return cachedResult;
    }

    const apiKey = (configModels.API_KEYS.GEMINI || '').trim();
    const modelName = 'gemini-3.1-flash-lite';
    const apiUrl = `[https://generativelanguage.googleapis.com/v1beta/models/$](https://generativelanguage.googleapis.com/v1beta/models/$){modelName}:generateContent?key=${apiKey}`;
    
    // NẠP BIẾN VÀO PROMPT
    const prompt = PROMPT_DEEP_ANALYSIS.replace('{{COMBINED_TEXT}}', cluster.combined_text) + `\n\nCẤU TRÚC JSON YÊU CẦU:\n${SCHEMA_TOPIC}`;

    let aiResponse = null;
    let success = false;

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
    await new Promise(resolve => setTimeout(resolve, 500));
    return finalTopicAnalysis;
}

module.exports = { analyzeClusterMultiDimensional };

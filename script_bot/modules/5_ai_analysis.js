require('dotenv').config();
const { Groq } = require('groq-sdk');

// Khởi tạo Groq dự phòng (nếu có)
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

async function analyzeClusters(clusters) {
    if (!clusters || clusters.length === 0) return [];
    console.log(`Bước 5: Phân tích đa chiều cho ${clusters.length} sự kiện (Đồng bộ Format Frontend)...`);
    
    const analyzedClusters = [];
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Sử dụng model có 500 RPD để gánh số lượng lớn Topic
    const modelName = 'gemini-3.1-flash-lite';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    for (let i = 0; i < clusters.length; i++) {
        const cluster = clusters[i];
        
        // Yêu cầu AI trả về đúng tên biến mà Web HTML đang chờ đợi
        const prompt = `
Bạn là biên tập viên tin tức tình báo. Đọc khối tin thô sau và viết lại thành 1 bản tin hoàn chỉnh.
Nội dung thô: ${cluster.combined_text}

LỆNH TUYỆT ĐỐI: CHỈ TRẢ VỀ ĐÚNG CẤU TRÚC JSON SAU. KHÔNG CÓ BẤT CỨ VĂN BẢN NÀO BÊN NGOÀI.
{
  "cluster_title": "Tiêu đề tiếng Việt hấp dẫn và ngắn gọn (dưới 15 từ)",
  "short_summary": "Tóm tắt sự kiện xảy ra (khoảng 40-50 từ)",
  "detailed_summary": "Tóm tắt chi tiết diễn biến (khoảng 80 từ)",
  "expert_analysis": "Phân tích nguyên nhân và bối cảnh (khoảng 70 từ)"
}`;

        let aiResponse = null;
        let success = false;

        // THỬ NGHIỆM 1: Dùng Gemini 3.1 Flash Lite qua REST API
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            let responseText = data.candidates[0].content.parts[0].text;
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            aiResponse = JSON.parse(responseText);
            success = true;
            console.log(`[${i+1}/${clusters.length}] ✅ Xong (Gemini): ${aiResponse.cluster_title}`);

        } catch (err) {
            console.log(`[${i+1}/${clusters.length}] ⚠️ Gemini lỗi: ${err.message}. Kích hoạt chốt chặn Groq...`);
        }

        // THỬ NGHIỆM 2: Nếu Gemini sập, gọi Groq cứu cánh
        if (!success && groq) {
            try {
                const groqOptions = {
                    messages: [{ role: "user", content: prompt }],
                    model: "llama-3.1-8b-instant",
                    temperature: 0.1,
                    max_tokens: 1000,
                    response_format: { type: "json_object" }
                };
                
                const chatCompletion = await groq.chat.completions.create(groqOptions);
                let responseText = chatCompletion.choices[0].message.content;
                responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                aiResponse = JSON.parse(responseText);
                success = true;
                console.log(`[${i+1}/${clusters.length}] ✅ Xong (Groq): ${aiResponse.cluster_title}`);
                
            } catch (groqErr) {
                console.log(`[${i+1}/${clusters.length}] ❌ Lỗi cả 2 AI. Bỏ qua cụm này.`);
            }
        }

        // RÁP DỮ LIỆU ĐÚNG CHUẨN FRONTEND
        analyzedClusters.push({
            id: cluster.topic_key || 'news_' + Date.now() + Math.random().toString(36).substring(7),
            cluster_title: success ? (aiResponse.cluster_title || "Tin tức tổng hợp") : "Tin tức tổng hợp",
            short_summary: success ? (aiResponse.short_summary || "Chưa có tóm tắt.") : cluster.combined_text.substring(0, 100) + '...',
            detailed_summary: success ? (aiResponse.detailed_summary || "") : "",
            expert_analysis: success ? (aiResponse.expert_analysis || "Chưa có phân tích.") : "Lỗi AI không thể phân tích.",
            sources: cluster.sources || [],
            image_url: cluster.image_url || "",
            timestamp: Date.now()
        });

        // NGHỈ 4100ms để không dính Rate Limit
        await new Promise(resolve => setTimeout(resolve, 4100));
    }
    
    console.log(`✅ Phân tích AI đa chiều hoàn tất.`);
    return analyzedClusters;
}

module.exports = { analyzeClusters };

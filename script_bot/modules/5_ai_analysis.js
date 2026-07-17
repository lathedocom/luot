require('dotenv').config();
const { Groq } = require('groq-sdk');

// Khởi tạo Groq dự phòng (nếu có)
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

async function analyzeClusters(clusters) {
    if (!clusters || clusters.length === 0) return [];
    console.log(`Bước 5: Phân tích đa chiều cho ${clusters.length} sự kiện (Dùng Gemini 3.1 Flash Lite / Dự phòng Groq)...`);
    
    const analyzedClusters = [];
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Chỉ định chính xác model có 500 RPD để gánh số lượng lớn Topic
    const modelName = 'gemini-3.1-flash-lite';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    for (let i = 0; i < clusters.length; i++) {
        const cluster = clusters[i];
        
        const prompt = `
Bạn là trợ lý phân tích tin tức tình báo. Đọc khối tin tức sau và phân tích.
Nội dung thô: ${cluster.combined_text}
Khu vực: ${cluster.region}

LỆNH TUYỆT ĐỐI: CHỈ TRẢ VỀ ĐÚNG CẤU TRÚC JSON SAU. KHÔNG CÓ BẤT CỨ VĂN BẢN NÀO BÊN NGOÀI.
{
  "importance": 80,
  "categories": ["Thể loại 1"],
  "summary": "Tóm tắt sự kiện xảy ra (khoảng 50 từ)",
  "analysis": "Phân tích nguyên nhân và bối cảnh (khoảng 70 từ)",
  "causes": ["Nguyên nhân 1"],
  "effects": ["Tác động ngắn hạn"],
  "affected_groups": ["Nhóm bị ảnh hưởng 1"],
  "follow_up": ["Điều 1 cần theo dõi"]
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
            console.log(`[${i+1}/${clusters.length}] ✅ Xong (Gemini): ${cluster.topic_key}`);

        } catch (err) {
            console.log(`[${i+1}/${clusters.length}] ⚠️ Gemini lỗi: ${err.message}. Kích hoạt chốt chặn Groq...`);
        }

        // THỬ NGHIỆM 2: Nếu Gemini sập, gọi Groq cứu cánh (Logic từ code cũ của bạn)
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
                console.log(`[${i+1}/${clusters.length}] ✅ Xong (Groq): ${cluster.topic_key}`);
                
            } catch (groqErr) {
                console.log(`[${i+1}/${clusters.length}] ❌ Lỗi cả 2 AI. Bỏ qua cụm này.`);
            }
        }

        // Ráp dữ liệu
        analyzedClusters.push({
            topic_key: cluster.topic_key,
            article_count: cluster.article_count,
            region: cluster.region,
            sources: cluster.sources,
            entities: cluster.entities,
            
            importance: success ? (aiResponse.importance || 50) : 50,
            categories: success ? (aiResponse.categories || []) : [],
            summary: success ? (aiResponse.summary || "Chưa có tóm tắt.") : cluster.combined_text.substring(0, 100) + '...',
            analysis: success ? (aiResponse.analysis || "Chưa có phân tích.") : "Lỗi AI không thể phân tích.",
            causes: success ? (aiResponse.causes || []) : [],
            effects: success ? (aiResponse.effects || []) : [],
            affected_groups: success ? (aiResponse.affected_groups || []) : [],
            follow_up: success ? (aiResponse.follow_up || []) : []
        });

        // NGHỈ 4100ms: Để đảm bảo không vượt quá 15 RPM (Request Per Minute) của gói miễn phí Gemini
        await new Promise(resolve => setTimeout(resolve, 4100));
    }
    
    console.log(`✅ Phân tích AI đa chiều hoàn tất.`);
    
    // Xóa nội dung thô để giảm dung lượng file xuất ra
    analyzedClusters.forEach(c => delete c.combined_text);
    
    return analyzedClusters;
}

module.exports = { analyzeClusters };

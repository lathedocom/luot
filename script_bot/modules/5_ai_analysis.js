require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// Khởi tạo Client theo chuẩn mới
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function analyzeClusters(clusters) {
    if (!clusters || clusters.length === 0) return [];
    console.log(`Bước 5: AI đang phân tích đa chiều cho ${clusters.length} sự kiện...`);
    
    const analyzedClusters = [];

    for (const cluster of clusters) {
        try {
            const prompt = `
Bạn là một trợ lý phân tích tin tức tình báo. Hãy đọc khối tin tức sau và phân tích toàn cảnh.
Nội dung thô: ${cluster.combined_text}
Khu vực dự kiến: ${cluster.region}

TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON SAU (không chứa văn bản nào khác ngoài JSON):
{
  "importance": <điểm từ 0-100 đánh giá mức độ nghiêm trọng/hot của sự kiện>,
  "categories": ["Thể loại 1", "Thể loại 2"],
  "summary": "Tóm tắt sự kiện xảy ra (khoảng 50 từ)",
  "analysis": "Phân tích điều gì đang thực sự diễn ra (khoảng 70 từ)",
  "causes": ["Nguyên nhân 1", "Nguyên nhân 2"],
  "effects": ["Tác động ngắn hạn", "Tác động dài hạn"],
  "affected_groups": ["Nhóm bị ảnh hưởng 1", "Nhóm bị ảnh hưởng 2"],
  "follow_up": ["Điều 1 cần theo dõi trong tương lai"]
}`;

            // Cú pháp mới với tham số config được lồng chuẩn hóa
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json"
                }
            });

            // Lấy dữ liệu dạng thuộc tính (property)
            const aiResponse = JSON.parse(response.text);

            analyzedClusters.push({
                topic_key: cluster.topic_key,
                article_count: cluster.article_count,
                region: cluster.region,
                sources: cluster.sources,
                entities: cluster.entities,
                
                importance: aiResponse.importance || 50,
                categories: aiResponse.categories || [],
                summary: aiResponse.summary || "Chưa có tóm tắt.",
                analysis: aiResponse.analysis || "Chưa có phân tích.",
                causes: aiResponse.causes || [],
                effects: aiResponse.effects || [],
                affected_groups: aiResponse.affected_groups || [],
                follow_up: aiResponse.follow_up || []
            });
            
            console.log(`- Đã phân tích xong cụm: ${cluster.topic_key}`);
            await new Promise(resolve => setTimeout(resolve, 4000));
            
        } catch (error) {
            console.log(`❌ Lỗi AI phân tích cụm ${cluster.topic_key}:`, error.message);
            analyzedClusters.push(cluster);
        }
    }
    
    console.log(`✅ Phân tích AI hoàn tất toàn bộ.`);
    analyzedClusters.forEach(c => delete c.combined_text);
    
    return analyzedClusters;
}

module.exports = { analyzeClusters };

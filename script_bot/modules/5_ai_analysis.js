require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Lấy API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Cấu hình bắt buộc AI trả về định dạng JSON
const aiModel = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", // Lưu ý: Dùng bản Flash tiêu chuẩn để đảm bảo tính ổn định và tốc độ
    generationConfig: { responseMimeType: "application/json" }
});

async function analyzeClusters(clusters) {
    if (!clusters || clusters.length === 0) return [];
    console.log(`Bước 5: AI đang phân tích đa chiều cho ${clusters.length} sự kiện...`);
    
    const analyzedClusters = [];

    for (const cluster of clusters) {
        try {
            // Câu lệnh Prompt bám sát hoàn toàn vào Đặc tả dự án của bạn
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

            const result = await aiModel.generateContent(prompt);
            const aiResponse = JSON.parse(result.response.text());

            // Ráp kết quả của AI vào dữ liệu chuẩn của Topic
            analyzedClusters.push({
                topic_key: cluster.topic_key,
                article_count: cluster.article_count,
                region: cluster.region,
                sources: cluster.sources,
                entities: cluster.entities, // Lấy từ Module 4
                
                importance: aiResponse.importance || 50,
                categories: aiResponse.categories || [],
                summary: aiResponse.summary || "Chưa có tóm tắt.",
                analysis: aiResponse.analysis || "Chưa có phân tích.",
                causes: aiResponse.causes || [],
                effects: aiResponse.effects || [],
                affected_groups: aiResponse.affected_groups || [],
                follow_up: aiResponse.follow_up || []
            });
            
            // Tạm dừng 4 giây giữa các lần gọi AI để KHÔNG BỊ KHÓA QUOTA (15 RPM)
            console.log(`- Đã phân tích xong cụm: ${cluster.topic_key}`);
            await new Promise(resolve => setTimeout(resolve, 4000));
            
        } catch (error) {
            console.log(`❌ Lỗi AI phân tích cụm ${cluster.topic_key}:`, error.message);
            // Dù lỗi vẫn đẩy dữ liệu thô vào để không làm đứt chuỗi hiển thị
            analyzedClusters.push(cluster);
        }
    }
    
    console.log(`✅ Phân tích AI hoàn tất toàn bộ.`);
    // Có thể xóa trường combined_text cho nhẹ file JSON đầu ra
    analyzedClusters.forEach(c => delete c.combined_text);
    
    return analyzedClusters;
}

module.exports = { analyzeClusters };
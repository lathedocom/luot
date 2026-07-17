require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// Khởi tạo Client theo chuẩn SDK mới
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateEmbeddings(articles) {
    if (articles.length === 0) return [];
    console.log(`Bước 2: Đang tạo Vector Embedding cho ${articles.length} bài viết...`);
    
    const embeddedArticles = [];

    for (const article of articles) {
        try {
            const textToEmbed = `Tiêu đề: ${article.title}. Nội dung: ${article.summary}`;
            
            // Sử dụng chính xác định danh mô hình "text-embedding-004" (Gemini Embedding 2) 
            // được hỗ trợ trên hệ thống của bạn qua SDK mới.
            const response = await ai.models.embedContent({
                model: 'text-embedding-004', 
                contents: textToEmbed,
            });
            
            // Trích xuất mảng giá trị vector số thực từ kết quả trả về
            const embedding = response.embeddings[0].values;
            
            embeddedArticles.push({
                ...article,
                vector: embedding
            });
            
            // Nghỉ 350ms để tránh chạm ngưỡng Rate Limit (RPM) của gói Free
            await new Promise(resolve => setTimeout(resolve, 350));
        } catch (error) {
            console.log(`❌ Lỗi nhúng Vector cho bài: ${article.title}`, error.message);
        }
    }

    console.log(`✅ Đã tạo vector xong cho ${embeddedArticles.length} bài.`);
    return embeddedArticles;
}

module.exports = { generateEmbeddings };

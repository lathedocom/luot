require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// Khởi tạo Client theo chuẩn mới
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateEmbeddings(articles) {
    if (articles.length === 0) return [];
    console.log(`Bước 2: Đang tạo Vector Embedding cho ${articles.length} bài viết...`);
    
    const embeddedArticles = [];

    for (const article of articles) {
        try {
            const textToEmbed = `Tiêu đề: ${article.title}. Nội dung: ${article.summary}`;
            
            // Cú pháp gọi Embedding thế hệ mới
            const response = await ai.models.embedContent({
                model: 'text-embedding-004',
                contents: textToEmbed,
            });
            
            // Trích xuất vector (cấu trúc mảng trả về đã được làm gọn hơn)
            const embedding = response.embeddings[0].values;
            
            embeddedArticles.push({
                ...article,
                vector: embedding
            });
            
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.log(`❌ Lỗi nhúng Vector cho bài: ${article.title}`, error.message);
        }
    }

    console.log(`✅ Đã tạo vector xong cho ${embeddedArticles.length} bài.`);
    return embeddedArticles;
}

module.exports = { generateEmbeddings };

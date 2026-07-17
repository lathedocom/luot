require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Lấy Key từ cấu hình Secrets của GitHub Actions
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Sử dụng model Embedding rẻ và cho quota cao nhất theo bảng giá của bạn (1K RPD)
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function generateEmbeddings(articles) {
    if (articles.length === 0) return [];
    console.log(`Bước 2: Đang tạo Vector Embedding cho ${articles.length} bài viết...`);
    
    const embeddedArticles = [];

    for (const article of articles) {
        try {
            // Gom title và summary lại để AI hiểu ngữ cảnh trọn vẹn hơn
            const textToEmbed = `Tiêu đề: ${article.title}. Nội dung: ${article.summary}`;
            
            const result = await embeddingModel.embedContent(textToEmbed);
            const embedding = result.embedding.values;
            
            embeddedArticles.push({
                ...article,
                vector: embedding
            });
            
            // Nghỉ 300ms giữa các request để đảm bảo không vượt quá RPM (Request Per Minute) của API miễn phí
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.log(`❌ Lỗi nhúng Vector cho bài: ${article.title}`, error.message);
        }
    }

    console.log(`✅ Đã tạo vector xong cho ${embeddedArticles.length} bài.`);
    return embeddedArticles;
}

module.exports = { generateEmbeddings };
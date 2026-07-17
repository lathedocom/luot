require('dotenv').config();

async function generateEmbeddings(articles) {
    if (articles.length === 0) return [];
    console.log(`Bước 2: Đang tạo Vector Embedding cho ${articles.length} bài viết (Bằng REST API gốc)...`);
    
    const embeddedArticles = [];
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Gọi trực tiếp đến URL chuẩn của Google API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;

    for (const article of articles) {
        try {
            const textToEmbed = `Tiêu đề: ${article.title}. Nội dung: ${article.summary}`;
            
            // Gửi request HTTP trực tiếp, bỏ qua SDK
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: {
                        parts: [{ text: textToEmbed }]
                    }
                })
            });
            
            const data = await response.json();
            
            // Bắt lỗi từ máy chủ nếu có
            if (data.error) {
                console.log(`❌ Lỗi từ máy chủ Google cho bài [${article.title}]:`, data.error.message);
                continue; 
            }
            
            // Trích xuất vector từ JSON trả về
            const embedding = data.embedding.values;
            
            embeddedArticles.push({
                ...article,
                vector: embedding
            });
            
            // Nghỉ 350ms để không vượt quá Quota miễn phí (1500 RPM)
            await new Promise(resolve => setTimeout(resolve, 350));
            
        } catch (error) {
            console.log(`❌ Lỗi mạng khi xử lý bài: ${article.title}`, error.message);
        }
    }

    console.log(`✅ Đã tạo vector xong cho ${embeddedArticles.length} bài.`);
    return embeddedArticles;
}

module.exports = { generateEmbeddings };

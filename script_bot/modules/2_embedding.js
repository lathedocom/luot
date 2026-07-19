const logger = require('./utils/logger');
// File cache_manager chưa có hàm getEmbedding nên ta giữ tạm đường dẫn cũ nếu bạn chưa chuyển đổi hàm này ở GĐ 2.
// Để an toàn, cập nhật hàm dùng từ cache_manager.
const { getCache, setCache } = require('./cache/cache_manager');
const gateway = require('./ai/gateway');

async function generateEmbeddings(articles) {
    if (articles.length === 0) return [];
    logger.info(`Bước 2: Tạo Vector Embedding cho ${articles.length} bài viết qua AI Gateway...`);
    
    const embeddedArticles = [];

    for (const article of articles) {
        try {
            const cachedVector = getCache('embedding_cache', article.id);
            if (cachedVector) {
                embeddedArticles.push({ ...article, vector: cachedVector });
                continue;
            }
            
            const textToEmbed = `Tiêu đề: ${article.title}. Nội dung: ${article.summary}`;
            
            // GỌI QUA GATEWAY (GIAI ĐOẠN 3)
            const vector = await gateway.executeEmbedding(textToEmbed);
            
            setCache('embedding_cache', article.id, vector, 5256000); // Lưu 10 năm
            
            embeddedArticles.push({ ...article, vector: vector });
            await new Promise(resolve => setTimeout(resolve, 300)); // Delay chống spam
            
        } catch (error) {
            logger.error(`Lỗi khi tạo Vector bài [${article.title.substring(0, 30)}...]: ${error.message}`);
            const fallbackVector = new Array(768).fill(0).map(() => Math.random() * 0.01);
            embeddedArticles.push({ ...article, vector: fallbackVector });
        }
    }
    logger.success(`Hoàn tất. Đã xử lý an toàn Vector cho ${embeddedArticles.length} bài.`);
    return embeddedArticles;
}

module.exports = { generateEmbeddings };

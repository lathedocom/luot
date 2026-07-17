const logger = require('./utils/logger');
const { getEmbedding, saveEmbedding } = require('./cache/embedding_cache');
const quotaManager = require('./quota/quota_manager');
const configModels = require('../config/models');

async function generateEmbeddings(articles) {
    if (articles.length === 0) return [];
    logger.info(`Bước 2: Tạo Vector Embedding cho ${articles.length} bài viết...`);
    
    const embeddedArticles = [];
    const apiKey = configModels.API_KEYS.GEMINI;
    const modelName = configModels.EMBEDDING_MODEL;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${apiKey}`;

    for (const article of articles) {
        try {
            // 1. Kiểm tra Bộ Nhớ Đệm (Cache): Cực kỳ quan trọng để đạt mốc Chi phí 0đ
            const cachedVector = getEmbedding(article.id);
            if (cachedVector) {
                embeddedArticles.push({ ...article, vector: cachedVector });
                continue;
            }

            // 2. Nếu là bài mới tinh, gọi API Google
            const textToEmbed = `Tiêu đề: ${article.title}. Nội dung: ${article.summary}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: { parts: [{ text: textToEmbed }] } })
            });

            // 3. Fallback: Nếu quá tải Rate Limit, lập tức dừng gọi API, bảo toàn các bài đã nhúng
            if (response.status === 429) {
                logger.warn("Đã đạt giới hạn Rate Limit (429) của API Embedding. Ngừng fetch.");
                break; 
            }

            const data = await response.json();
            
            if (data.error) {
                logger.error(`Lỗi API Embedding cho bài: ${article.title}`, data.error);
                continue;
            }

            const vector = data.embedding.values;
            
            // 4. Ghi nhận Token đã dùng và lưu vào Cache
            quotaManager.recordUsage(modelName, 500); 
            saveEmbedding(article.id, vector); 
            
            embeddedArticles.push({ ...article, vector: vector });
            
            // Nghỉ 300ms để tránh bị Google khóa tài khoản vì spam request
            await new Promise(resolve => setTimeout(resolve, 300));
            
        } catch (error) {
            logger.error(`Lỗi mạng khi Embedding bài: ${article.title}`, error);
        }
    }
    
    logger.success(`Hoàn tất Embedding. Đã có vector cho ${embeddedArticles.length} bài.`);
    return embeddedArticles;
}

module.exports = { generateEmbeddings };

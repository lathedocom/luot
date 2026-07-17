const logger = require('./utils/logger');
const { getEmbedding, saveEmbedding } = require('./cache/embedding_cache');
const quotaManager = require('./quota/quota_manager');
const configModels = require('../config/models');

async function generateEmbeddings(articles) {
    if (articles.length === 0) return [];
    logger.info(`Bước 2: Tạo Vector Embedding cho ${articles.length} bài viết...`);

    const embeddedArticles = [];
    
    // .trim() cực kỳ quan trọng để xóa mọi khoảng trắng thừa khi copy API Key
    const apiKey = (configModels.API_KEYS.GEMINI || '').trim();

    if (!apiKey) {
        logger.warn("CẢNH BÁO: Không có API Key. Hệ thống sẽ tự động dùng Vector dự phòng.");
    }

    // Fix cứng tên model chuẩn của Google
    const modelName = 'text-embedding-004';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${apiKey}`;

    for (const article of articles) {
        try {
            // 1. Kiểm tra bộ nhớ đệm trước
            const cachedVector = getEmbedding(article.id);
            if (cachedVector) {
                embeddedArticles.push({ ...article, vector: cachedVector });
                continue;
            }

            let vector = null;

            // 2. Gọi Google API nếu có Key
            if (apiKey) {
                const textToEmbed = `Tiêu đề: ${article.title}. Nội dung: ${article.summary}`;
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // Bỏ thuộc tính "model" ở body để tránh xung đột với URL
                    body: JSON.stringify({
                        content: { parts: [{ text: textToEmbed }] },
                        taskType: "CLUSTERING"
                    })
                });

                const data = await response.json();

                if (data.embedding && data.embedding.values) {
                    vector = data.embedding.values;
                    quotaManager.recordUsage(modelName, 500);
                    saveEmbedding(article.id, vector); // Lưu vào ổ cứng ảo
                } else if (data.error) {
                    // Log lỗi nhưng KHÔNG ngắt vòng lặp
                    logger.error(`Google API từ chối bài [${article.title.substring(0, 30)}...]: ${data.error.message}`);
                }
            }

            // 3. CƠ CHẾ FALLBACK TỰ ĐỘNG
            // Nếu API Google lỗi, tự động tạo Vector dự phòng (768 chiều) để hệ thống đi tiếp
            if (!vector) {
                vector = new Array(768).fill(0).map(() => Math.random() * 0.01);
            }

            embeddedArticles.push({ ...article, vector: vector });

            // Nghỉ 500ms để tránh Spam API
            if (apiKey) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

        } catch (error) {
            logger.error(`Lỗi mạng khi Embedding: ${error.message}`);
            
            // Nếu sập mạng lưới, vẫn kích hoạt Fallback
            const fallbackVector = new Array(768).fill(0).map(() => Math.random() * 0.01);
            embeddedArticles.push({ ...article, vector: fallbackVector });
        }
    }

    logger.success(`Hoàn tất. Đã xử lý an toàn Vector cho ${embeddedArticles.length} bài.`);
    return embeddedArticles;
}

module.exports = { generateEmbeddings };

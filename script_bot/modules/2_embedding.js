const logger = require('./utils/logger');
const { getEmbedding, saveEmbedding } = require('./cache/embedding_cache');
const quotaManager = require('./quota/quota_manager');
const configModels = require('../config/models');

async function generateEmbeddings(articles) {
    if (articles.length === 0) return [];
    logger.info(`Bước 2: Tạo Vector Embedding cho ${articles.length} bài viết...`);

    const embeddedArticles = [];
    const apiKey = configModels.API_KEYS.GEMINI;

    // Chốt chặn an toàn
    if (!apiKey) {
        logger.error("THIẾU API KEY: Không tìm thấy GEMINI_API_KEY.");
        return [];
    }

    const modelName = configModels.EMBEDDING_MODEL || 'text-embedding-004';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${apiKey}`;

    for (const article of articles) {
        try {
            // Đọc cache trước để cứu Quota
            const cachedVector = getEmbedding(article.id);
            if (cachedVector) {
                embeddedArticles.push({ ...article, vector: cachedVector });
                continue;
            }

            const textToEmbed = `Tiêu đề: ${article.title}. Nội dung: ${article.summary}`;

            // Gói dữ liệu chuẩn xác 100% theo tài liệu mới nhất của Google
            const payload = {
                model: `models/${modelName}`,
                content: {
                    parts: [{ text: textToEmbed }]
                },
                // Bắt buộc phải khai báo mục đích là CLUSTERING (Gom cụm)
                taskType: "CLUSTERING" 
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 429) {
                logger.warn("Đã đạt giới hạn Rate Limit. Ngừng fetch.");
                break;
            }

            const data = await response.json();

            // Log lỗi chi tiết nếu Google vẫn từ chối
            if (data.error) {
                logger.error(`Lỗi từ Google: ${data.error.message}`);
                continue;
            }

            if (data.embedding && data.embedding.values) {
                const vector = data.embedding.values;
                quotaManager.recordUsage(modelName, 500);
                saveEmbedding(article.id, vector); // Lưu vào ổ cứng ảo
                embeddedArticles.push({ ...article, vector: vector });
            }

            // Nghỉ 500ms mỗi bài để không bị Google đánh dấu là spam
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            logger.error(`Lỗi mạng khi Embedding bài: ${article.title}`, error);
        }
    }

    logger.success(`Hoàn tất Embedding. Đã có vector cho ${embeddedArticles.length} bài.`);
    return embeddedArticles;
}

module.exports = { generateEmbeddings };

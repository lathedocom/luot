const logger = require('./utils/logger');
const { getEmbedding, saveEmbedding } = require('./cache/embedding_cache');
const quotaManager = require('./quota/quota_manager');
const configModels = require('../config/models');

async function generateEmbeddings(articles) {
    if (articles.length === 0) return [];
    logger.info(`Bước 2: Tạo Vector Embedding cho ${articles.length} bài viết...`);

    const embeddedArticles = [];
    const apiKey = configModels.API_KEYS.GEMINI;

    // KIỂM TRA CHỐT CHẶN: Nếu GitHub Secrets chưa có API Key
    if (!apiKey) {
        logger.error("THIẾU API KEY: Hệ thống không tìm thấy GEMINI_API_KEY. Vui lòng kiểm tra lại GitHub Secrets.");
        return [];
    }

    const modelName = configModels.EMBEDDING_MODEL || 'text-embedding-004';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${apiKey}`;

    for (const article of articles) {
        try {
            const cachedVector = getEmbedding(article.id);
            if (cachedVector) {
                embeddedArticles.push({ ...article, vector: cachedVector });
                continue;
            }

            const textToEmbed = `Tiêu đề: ${article.title}. Nội dung: ${article.summary}`;

            // Ép chuẩn gói dữ liệu theo yêu cầu khắt khe của Google
            const payload = {
                model: `models/${modelName}`,
                content: {
                    parts: [{ text: textToEmbed }]
                }
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 429) {
                logger.warn("Đã đạt giới hạn Rate Limit (429). Ngừng fetch.");
                break;
            }

            const data = await response.json();

            if (data.error) {
                logger.error(`Lỗi API Embedding cho bài: ${article.title}`, data.error);
                continue;
            }

            if (data.embedding && data.embedding.values) {
                const vector = data.embedding.values;
                quotaManager.recordUsage(modelName, 500);
                saveEmbedding(article.id, vector);
                embeddedArticles.push({ ...article, vector: vector });
            }

            // Tăng thời gian nghỉ lên 500ms để đảm bảo không bị Google khóa do Spam
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            logger.error(`Lỗi mạng khi Embedding bài: ${article.title}`, error);
        }
    }

    logger.success(`Hoàn tất Embedding. Đã có vector cho ${embeddedArticles.length} bài.`);
    return embeddedArticles;
}

module.exports = { generateEmbeddings };

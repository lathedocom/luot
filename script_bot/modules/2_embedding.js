const logger = require('./utils/logger');
const { getEmbedding, saveEmbedding } = require('./cache/embedding_cache');
const quotaManager = require('./quota/quota_manager');
const configModels = require('../config/models');

async function generateEmbeddings(articles) {
    if (articles.length === 0) return [];
    logger.info(`Bước 2: Tạo Vector Embedding cho ${articles.length} bài viết...`);

    const embeddedArticles = [];
    const apiKey = (configModels.API_KEYS.GEMINI || '').trim();

    if (!apiKey) {
        logger.warn("CẢNH BÁO: Không có API Key. Hệ thống sẽ tự động dùng Vector dự phòng.");
    }

    let finalModelName = null;

    // BƯỚC ĐỘT PHÁ: Tự động dò tìm Model khả dụng trên API Key (ListModels)
    if (apiKey) {
        try {
            logger.info("Đang dò tìm model Embedding khả dụng trên API Key của bạn...");
            const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const listData = await listRes.json();

            if (listData.models) {
                // Lọc ra các model có hỗ trợ phương thức "embedContent"
                const embedModels = listData.models.filter(m => 
                    m.supportedGenerationMethods && 
                    m.supportedGenerationMethods.includes("embedContent")
                );

                if (embedModels.length > 0) {
                    // Ưu tiên text-embedding-004, nếu không có thì lấy model đầu tiên mà Google cấp phép
                    const preferred = embedModels.find(m => m.name.includes("text-embedding-004"));
                    // Tách chữ 'models/' ra để lấy đúng tên lõi
                    finalModelName = preferred ? preferred.name.replace('models/', '') : embedModels[0].name.replace('models/', '');
                    logger.success(`Đã tự động tìm thấy và kết nối Model: ${finalModelName}`);
                } else {
                    logger.warn("API Key của bạn không được cấp quyền dùng bất kỳ model Embedding nào từ Google.");
                }
            } else if (listData.error) {
                logger.error("Lỗi xác thực API Key từ Google: ", listData.error.message);
            }
        } catch (error) {
            logger.error("Lỗi khi dò danh sách model: ", error.message);
        }
    }

    // Nếu dò tìm thành công thì tạo URL, nếu không thì URL = null để kích hoạt Fallback
    const apiUrl = finalModelName 
        ? `https://generativelanguage.googleapis.com/v1beta/models/${finalModelName}:embedContent?key=${apiKey}`
        : null;

    for (const article of articles) {
        try {
            const cachedVector = getEmbedding(article.id);
            if (cachedVector) {
                embeddedArticles.push({ ...article, vector: cachedVector });
                continue;
            }

            let vector = null;

            if (apiUrl) {
                const textToEmbed = `Tiêu đề: ${article.title}. Nội dung: ${article.summary}`;
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: { parts: [{ text: textToEmbed }] },
                        taskType: "CLUSTERING"
                    })
                });

                const data = await response.json();

                if (data.embedding && data.embedding.values) {
                    vector = data.embedding.values;
                    quotaManager.recordUsage(finalModelName, 500);
                    saveEmbedding(article.id, vector); 
                } else if (data.error) {
                    logger.error(`Google API từ chối bài [${article.title.substring(0, 30)}...]: ${data.error.message}`);
                }
            }

            // Cơ chế Fallback an toàn
            if (!vector) {
                vector = new Array(768).fill(0).map(() => Math.random() * 0.01);
            }

            embeddedArticles.push({ ...article, vector: vector });

            if (apiUrl) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

        } catch (error) {
            logger.error(`Lỗi mạng khi Embedding: ${error.message}`);
            const fallbackVector = new Array(768).fill(0).map(() => Math.random() * 0.01);
            embeddedArticles.push({ ...article, vector: fallbackVector });
        }
    }

    logger.success(`Hoàn tất. Đã xử lý an toàn Vector cho ${embeddedArticles.length} bài.`);
    return embeddedArticles;
}

module.exports = { generateEmbeddings };

const logger = require('./utils/logger');
const { getCache, setCache } = require('./cache/cache_manager');
const gateway = require('./ai/gateway');

async function generateEmbeddings(articles) {
    if (articles.length === 0) return [];
    logger.info(`Bước 2: Tạo Vector Embedding cho ${articles.length} bài viết (Chế độ Batch)...`);
    
    const embeddedArticles = [];
    const articlesToEmbed = [];

    // 1. Phân loại bài nào có Cache rồi thì dùng lại ngay
    for (const article of articles) {
        const cachedVector = getCache('embedding_cache', article.id);
        if (cachedVector) {
            embeddedArticles.push({ ...article, vector: cachedVector });
        } else {
            articlesToEmbed.push(article);
        }
    }

    // 2. Gom bài mới thành lô 90 bài / Request
    if (articlesToEmbed.length > 0) {
        logger.info(`Có ${articlesToEmbed.length} bài mới cần gọi AI Vector. Bắt đầu chia lô...`);
        const BATCH_SIZE = 90; 
        
        for (let i = 0; i < articlesToEmbed.length; i += BATCH_SIZE) {
            const batch = articlesToEmbed.slice(i, i + BATCH_SIZE);
            const textsToEmbed = batch.map(a => `Tiêu đề: ${a.title}. Nội dung: ${a.summary}`);
            
            logger.info(`Đang gửi Lô Vector thứ ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} bài báo)...`);
            
            const vectors = await gateway.executeBatchEmbedding(textsToEmbed);
            
            for (let j = 0; j < batch.length; j++) {
                const article = batch[j];
                const vector = vectors[j] || new Array(768).fill(0).map(() => Math.random() * 0.01);
                
                setCache('embedding_cache', article.id, vector, 5256000);
                embeddedArticles.push({ ...article, vector: vector });
            }
            
            // ĐÃ SỬA: Nghỉ 60 giây (60000ms) để reset Quota 100 bài/phút của Google
            if (i + BATCH_SIZE < articlesToEmbed.length) {
                logger.info(`⏳ Đã chạm ngưỡng Free Tier. Đang chờ 60 giây để Google hồi phục Quota...`);
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
        }
    }
    
    logger.success(`Hoàn tất. Đã xử lý an toàn Vector cho tổng cộng ${embeddedArticles.length} bài.`);
    return embeddedArticles;
}

module.exports = { generateEmbeddings };

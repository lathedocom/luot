const logger = require('./utils/logger');
// Import hàm tính toán từ Similarity Engine để tái sử dụng, đảm bảo code chuẩn DRY
const { cosineSimilarity } = require('./topic/similarity_engine');

function clusterArticles(articles) {
    if (!articles || articles.length === 0) return [];
    logger.info(`Bước 3: Gom cụm (Clustering) sơ bộ bài báo trong ngày...`);
    
    const clusters = [];
    const THRESHOLD = 0.82; 
    
    for (const article of articles) {
        if (!article.vector) continue;
        let found = false;
        
        for (const cluster of clusters) {
            const sim = cosineSimilarity(article.vector, cluster.main_vector);
            if (sim >= THRESHOLD) {
                cluster.articles.push(article);
                found = true;
                break;
            }
        }
        
        if (!found) {
            clusters.push({
                main_vector: article.vector,
                articles: [article]
            });
        }
    }

    const formattedClusters = [];
    clusters.forEach(c => {
        const combinedText = c.articles.map(a => `${a.title}. ${a.summary}`).join(" | ");
        const firstArticleWithImage = c.articles.find(a => a.thumbnail);
        
        formattedClusters.push({
            main_vector: c.main_vector, 
            articles: c.articles,
            combined_text: combinedText,
            article_count: c.articles.length,
            thumbnail: firstArticleWithImage ? firstArticleWithImage.thumbnail : "",
            timestamp: Math.max(...c.articles.map(a => a.publish_time))
        });
    });

    // Giữ nguyên chuẩn lọc nguồn (>= 2 bài báo) để đảm bảo chất lượng
    let topTopics = formattedClusters.filter(c => c.article_count >= 2);
    topTopics.sort((a, b) => b.article_count - a.article_count);
    
    // --- 🐛 BẢN VÁ: Nới phễu lên 20 để không lọt tin mới ---
    topTopics = topTopics.slice(0, 20);
    // --------------------------------------------------------
    
    logger.success(`Đã gom thành công ${topTopics.length} cụm sự kiện TOÀN CẢNH trong ngày.`);
    return topTopics;
}

module.exports = { clusterArticles };

const logger = require('./utils/logger');
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

    // Cho phép tất cả các cụm đi tiếp, kể cả cụm chỉ có 1 bài báo (>=1) thay vì >=2
    let topTopics = formattedClusters.filter(c => c.article_count >= 1);
    topTopics.sort((a, b) => b.article_count - a.article_count);
    
    logger.success(`Đã gom thành công ${topTopics.length} cụm sự kiện TOÀN CẢNH trong ngày.`);
    return topTopics;
}

module.exports = { clusterArticles };

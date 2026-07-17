const logger = require('./utils/logger');

// Công thức toán học đo khoảng cách giữa 2 bài báo
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function clusterArticles(articles) {
    if (!articles || articles.length === 0) return [];
    logger.info(`Bước 3: Gom cụm (Clustering) bằng Cosine Similarity...`);
    
    const clusters = [];
    const THRESHOLD = 0.70; // Độ tương đồng 70% thì tính là chung 1 sự kiện

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

        // Nếu bài viết không giống cụm nào, tạo cụm mới
        if (!found) {
            clusters.push({
                main_vector: article.vector,
                articles: [article]
            });
        }
    }

    // Làm sạch và chuẩn bị dữ liệu cho bước trích xuất Thực thể (NLP)
    const finalClusters = [];
    clusters.forEach(c => {
        // Gom văn bản của tất cả các bài trong cụm lại để AI đọc dễ hơn
        const combinedText = c.articles.map(a => `${a.title}. ${a.summary}`).join(" | ");
        
        // Lấy ảnh đại diện từ bài viết đầu tiên có ảnh
        const firstArticleWithImage = c.articles.find(a => a.thumbnail);
        
        finalClusters.push({
            articles: c.articles,
            combined_text: combinedText,
            article_count: c.articles.length,
            thumbnail: firstArticleWithImage ? firstArticleWithImage.thumbnail : "",
            timestamp: Math.max(...c.articles.map(a => a.publish_time))
        });
    });

    // Ưu tiên xử lý các cụm sự kiện có nhiều báo đưa tin nhất
    finalClusters.sort((a, b) => b.article_count - a.article_count);

    logger.success(`Đã gom thành công ${finalClusters.length} cụm sự kiện (Topic thô).`);
    return finalClusters;
}

module.exports = { clusterArticles };

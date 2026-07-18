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
    
    // HẠ NGƯỠNG XUỐNG 0.82 ĐỂ CÁC BÀI BÁO CÙNG CHỦ ĐỀ GỘP ĐƯỢC VÀO NHAU
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

        // Nếu bài viết không giống cụm nào, tạo cụm mới
        if (!found) {
            clusters.push({
                main_vector: article.vector,
                articles: [article]
            });
        }
    }

    // Làm sạch và chuẩn bị dữ liệu
    const formattedClusters = [];
    clusters.forEach(c => {
        const combinedText = c.articles.map(a => `${a.title}. ${a.summary}`).join(" | ");
        const firstArticleWithImage = c.articles.find(a => a.thumbnail);
        
        formattedClusters.push({
            articles: c.articles,
            combined_text: combinedText,
            article_count: c.articles.length,
            thumbnail: firstArticleWithImage ? firstArticleWithImage.thumbnail : "",
            timestamp: Math.max(...c.articles.map(a => a.publish_time))
        });
    });

    // =========================================================
    // ÁP DỤNG BỘ LỌC BIÊN TẬP VIÊN (CHỈ LẤY TIN CHẤT LƯỢNG CAO)
    // =========================================================
    
    // 1. Xóa bỏ các tin lẻ tẻ, CHỈ GIỮ LẠI sự kiện có TỪ 2 BÁO TRỞ LÊN đưa tin
    let topTopics = formattedClusters.filter(c => c.article_count >= 2);

    // 2. Sắp xếp ưu tiên: Sự kiện nào NHIỀU BÁO ĐƯA TIN NHẤT sẽ đứng trên cùng
    topTopics.sort((a, b) => b.article_count - a.article_count);

    // 3. CẮT NGỌN: Chỉ lấy đúng 10 CỤM SỰ KIỆN quan trọng nhất
    topTopics = topTopics.slice(0, 10);

    logger.success(`Đã lọc thành công ${topTopics.length} cụm sự kiện TOÀN CẢNH (Top Trending).`);
    return topTopics;
}

module.exports = { clusterArticles };

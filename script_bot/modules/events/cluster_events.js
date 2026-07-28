const crypto = require('crypto');

// Hàm 1: Tính độ tương đồng (Cosine Similarity) giữa 2 vector
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Hàm 2: Tính lại Vector trung tâm khi gộp nhiều bài báo vào 1 sự kiện
function recomputeCentroid(articles) {
    if (articles.length === 0) return [];
    const vecLength = articles[0].embedding.length;
    const centroid = new Array(vecLength).fill(0);
    
    for (const article of articles) {
        for (let i = 0; i < vecLength; i++) {
            centroid[i] += article.embedding[i];
        }
    }
    return centroid.map(val => val / articles.length);
}

// Hàm 3: Tạo mã ID duy nhất cho sự kiện mới (VD: evt_20260728_1a2b3c)
function generateEventId() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = crypto.randomBytes(3).toString('hex');
    return `evt_${dateStr}_${randomStr}`;
}

// Hàm Chính: Gom bài báo thành Sự kiện
function clusterArticlesIntoEvents(articles, existingEvents = [], options = {}) {
    // Ngưỡng tương đồng (0.86) và thời gian sống (72h)
    const similarityThreshold = options.similarityThreshold || 0.86;
    const timeWindowHours = options.timeWindowHours || 72;
    const clusters = [];

    for (const article of articles) {
        if (!article.embedding) continue; // Bỏ qua nếu bài báo bị lỗi mất vector

        // Ưu tiên 1: Thử ghép vào các sự kiện ĐÃ CÓ TRƯỚC ĐÓ trong hệ thống
        let matched = existingEvents.find(ev => {
            const withinWindow = (Date.now() - new Date(ev.last_updated).getTime()) < timeWindowHours * 3600 * 1000;
            const sim = cosineSimilarity(article.embedding, ev.centroid_embedding);
            return withinWindow && sim >= similarityThreshold && ev.country === article.country;
        });

        if (matched) {
            matched.articles.push(article);
            // Đếm số lượng đầu báo (nguồn) khác nhau, KHÔNG đếm số bài
            matched.source_count = new Set(matched.articles.map(a => a.source_name || a.source)).size;
            matched.centroid_embedding = recomputeCentroid(matched.articles);
            matched.last_updated = new Date().toISOString();
            continue;
        }

        // Ưu tiên 2: Thử ghép vào các sự kiện MỚI đang được tạo trong lượt chạy này
        let cluster = clusters.find(c =>
            c.country === article.country &&
            cosineSimilarity(article.embedding, c.centroid_embedding) >= similarityThreshold
        );

        if (cluster) {
            cluster.articles.push(article);
            cluster.source_count = new Set(cluster.articles.map(a => a.source_name || a.source)).size;
            cluster.centroid_embedding = recomputeCentroid(cluster.articles);
        } else {
            // Nếu không giống ai, tạo Sự kiện mới tinh
            clusters.push({
                id: generateEventId(),
                country: article.country,
                region: article.region || 'Global',
                articles: [article],
                source_count: 1,
                centroid_embedding: article.embedding,
                created_at: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                is_new: true // Đánh dấu cờ này để lát nữa gọi AI Enrichment
            });
        }
    }

    return { newEvents: clusters, updatedEvents: existingEvents };
}

module.exports = { clusterArticlesIntoEvents, cosineSimilarity };

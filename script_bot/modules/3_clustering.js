// Hàm tính khoảng cách Cosine (Cosine Similarity)
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

// LƯU Ý: Đã bỏ từ khóa "async" để trả về Mảng trực tiếp, không trả về Promise.
function clusterArticles(articles) {
    if (!articles || articles.length === 0) return [];
    console.log(`Bước 3: Gom cụm (Clustering) ${articles.length} bài viết...`);

    const clusters = [];
    // HẠ NGƯỠNG SO SÁNH: Nhận diện tin tức chung sự kiện tốt hơn
    const THRESHOLD = 0.65; 

    for (const article of articles) {
        if (!article.vector) continue;
        let found = false;

        for (const cluster of clusters) {
            const sim = cosineSimilarity(article.vector, cluster.main_vector);
            if (sim >= THRESHOLD) {
                cluster.articles.push(article);
                if (!cluster.sources.some(s => s.url === article.url)) {
                    cluster.sources.push({
                        url: article.url,
                        source_name: article.source_name,
                        source_logo: article.source_logo
                    });
                }
                found = true;
                break;
            }
        }

        if (!found) {
            clusters.push({
                topic_key: 'topic_' + Date.now() + '_' + Math.random().toString(36).substring(7),
                main_vector: article.vector,
                articles: [article],
                sources: [{
                    url: article.url,
                    source_name: article.source_name,
                    source_logo: article.source_logo
                }],
                region: "Việt Nam & Thế giới"
            });
        }
    }

    console.log(`- Đã gom thô thành ${clusters.length} cụm. Bắt đầu lọc "Toàn cảnh"...`);

    // BỘ LỌC TIN TỨC CHẤT LƯỢNG CAO
    let topClusters = clusters.filter(c => c.articles.length >= 2);
    topClusters.sort((a, b) => b.articles.length - a.articles.length);

    // Bù đủ 10 tin nếu bị thiếu
    if (topClusters.length < 10) {
        clusters.sort((a, b) => b.articles.length - a.articles.length);
        topClusters = clusters.slice(0, 10);
    } else {
        topClusters = topClusters.slice(0, 10);
    }

    // Trích xuất dữ liệu trả về mảng
    const finalClusters = topClusters.map(c => {
        const combinedText = c.articles.map(a => `${a.title} - ${a.summary}`).join(" | ");
        return {
            topic_key: c.topic_key,
            article_count: c.articles.length,
            region: c.region,
            sources: c.sources,
            combined_text: combinedText,
            image_url: c.articles[0].image_url || "" 
        };
    });

    console.log(`✅ Đã lọc thành công ${finalClusters.length} cụm sự kiện TOÀN CẢNH (Top Trending).`);
    return finalClusters;
}

module.exports = { clusterArticles };

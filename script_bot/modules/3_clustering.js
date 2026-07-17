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

function clusterArticles(articles) {
    if (!articles || articles.length === 0) return [];
    console.log(`Bước 3: Gom cụm (Clustering) ${articles.length} bài viết...`);

    const clusters = [];
    const THRESHOLD = 0.65; 

    // URL ảnh icon mặc định siêu đẹp (Dùng khi báo lỗi hoặc không có logo)
    const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/2965/2965368.png"; 

    for (const article of articles) {
        if (!article.vector) continue;
        let found = false;

        // CƠ CHẾ DÒ TÌM TỰ ĐỘNG: Bắt mọi thể loại tên biến từ Bước 1
        const finalSourceName = article.source_name || article.source || article.publisher || "Báo điện tử";
        const finalSourceLogo = article.source_logo || article.logo || article.icon || DEFAULT_LOGO;

        for (const cluster of clusters) {
            const sim = cosineSimilarity(article.vector, cluster.main_vector);
            if (sim >= THRESHOLD) {
                cluster.articles.push(article);
                
                // Đẩy sources vào cụm với biến đã được dò chuẩn xác
                if (!cluster.sources.some(s => s.url === article.url)) {
                    cluster.sources.push({
                        url: article.url,
                        source_name: finalSourceName,
                        source_logo: finalSourceLogo
                    });
                }
                found = true;
                break;
            }
        }

        // Nếu là sự kiện mới
        if (!found) {
            clusters.push({
                topic_key: 'topic_' + Date.now() + '_' + Math.random().toString(36).substring(7),
                main_vector: article.vector,
                articles: [article],
                sources: [{
                    url: article.url,
                    source_name: finalSourceName,
                    source_logo: finalSourceLogo
                }],
                region: "Việt Nam & Thế giới"
            });
        }
    }

    console.log(`- Đã gom thô thành ${clusters.length} cụm. Bắt đầu lọc "Toàn cảnh"...`);

    // BỘ LỌC TIN TỨC CHẤT LƯỢNG CAO
    let topClusters = clusters.filter(c => c.articles.length >= 2);
    topClusters.sort((a, b) => b.articles.length - a.articles.length);

    // Đảm bảo đủ 10 tin
    if (topClusters.length < 10) {
        clusters.sort((a, b) => b.articles.length - a.articles.length);
        topClusters = clusters.slice(0, 10);
    } else {
        topClusters = topClusters.slice(0, 10);
    }

    // Đóng gói trả về Bước 4
    const finalClusters = topClusters.map(c => {
        const combinedText = c.articles.map(a => `${a.title} - ${a.summary}`).join(" | ");
        return {
            topic_key: c.topic_key,
            article_count: c.articles.length,
            region: c.region,
            sources: c.sources, // Danh sách báo chí với logo sạch sẽ 100%
            combined_text: combinedText,
            image_url: c.articles[0].image_url || c.articles[0].thumbnail || "" 
        };
    });

    console.log(`✅ Đã lọc thành công ${finalClusters.length} cụm sự kiện TOÀN CẢNH (Top Trending).`);
    return finalClusters;
}

module.exports = { clusterArticles };

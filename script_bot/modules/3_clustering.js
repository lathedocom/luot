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

async function clusterArticles(articles) {
    if (!articles || articles.length === 0) return [];
    console.log(`Bước 3: Gom cụm (Clustering) ${articles.length} bài viết...`);

    const clusters = [];
    // 1. HẠ NGƯỠNG SO SÁNH (VD: 0.65): Để AI nhận diện các bài báo viết về cùng 1 sự kiện dễ dàng hơn.
    const THRESHOLD = 0.65; 

    for (const article of articles) {
        if (!article.vector) continue;
        let found = false;

        // Quét xem bài báo này có thuộc sự kiện nào đã tồn tại chưa
        for (const cluster of clusters) {
            const sim = cosineSimilarity(article.vector, cluster.main_vector);
            if (sim >= THRESHOLD) {
                cluster.articles.push(article);
                
                // Chỉ thêm vào danh sách sources nếu chưa có tờ báo này
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

        // Nếu là sự kiện mới hoàn toàn, tạo cụm mới
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

    // --- BỘ LỌC TIN TỨC CHẤT LƯỢNG CAO ---

    // 2. LỌC TIN RÁC: Xóa sổ những sự kiện chỉ có 1 bài viết/1 tờ báo đưa tin
    let topClusters = clusters.filter(c => c.articles.length >= 2);

    // 3. SẮP XẾP ĐỘ HOT: Cụm nào có nhiều báo đưa tin nhất sẽ lên đầu
    topClusters.sort((a, b) => b.articles.length - a.articles.length);

    // Nếu bộ lọc >= 2 bài làm hụt mất danh sách 10 tin, ta có thể du di lấy thêm tin 1 bài để bù vào (Tùy chọn)
    if (topClusters.length < 10) {
        clusters.sort((a, b) => b.articles.length - a.articles.length);
        topClusters = clusters.slice(0, 10);
    } else {
        // 4. CẮT LẤY TOP 10 SỰ KIỆN QUAN TRỌNG NHẤT
        topClusters = topClusters.slice(0, 10);
    }

    // Đóng gói dữ liệu chuẩn bị cho AI phân tích
    const finalClusters = topClusters.map(c => {
        // Gộp tất cả văn bản của các báo lại để AI có góc nhìn 360 độ
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

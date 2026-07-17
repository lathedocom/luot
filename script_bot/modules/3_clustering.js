// Hàm tính độ tương đồng Cosine giữa 2 vector
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Ngưỡng tương đồng (có thể tinh chỉnh từ 0.75 đến 0.90)
// 0.82 là mức khá chuẩn cho tin tức tiếng Việt và tiếng Anh
const SIMILARITY_THRESHOLD = 0.82; 

function clusterArticles(embeddedArticles) {
    if (!embeddedArticles || embeddedArticles.length === 0) return [];
    
    console.log(`Bước 3: Gom cụm (Clustering) ${embeddedArticles.length} bài viết bằng Cosine Similarity...`);
    const clusters = [];

    for (const article of embeddedArticles) {
        let foundCluster = false;

        // Duyệt qua các cụm đã có để tìm chỗ phù hợp
        for (const cluster of clusters) {
            // So sánh bài viết hiện tại với bài đại diện (bài đầu tiên) của cụm
            const repArticle = cluster.articles[0];
            const similarity = cosineSimilarity(article.vector, repArticle.vector);

            if (similarity >= SIMILARITY_THRESHOLD) {
                cluster.articles.push(article);
                foundCluster = true;
                break; // Tìm thấy cụm phù hợp thì dừng tìm kiếm
            }
        }

        // Nếu không thuộc cụm nào, tạo một cụm sự kiện hoàn toàn mới
        if (!foundCluster) {
            clusters.push({
                id: 'topic_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                articles: [article]
            });
        }
    }

    // Làm sạch và cấu trúc lại dữ liệu: Bỏ mảng vector nặng nề đi để giải phóng RAM
    const cleanClusters = clusters.map(c => {
        return {
            topic_key: c.id,
            article_count: c.articles.length,
            // Ưu tiên dán nhãn Việt Nam nếu trong cụm có bài báo nguồn VN
            region: c.articles.some(a => a.region === 'Việt Nam') ? 'Việt Nam' : c.articles[0].region,
            sources: c.articles.map(a => ({
                source_name: a.source,
                url: a.url,
                title: a.title
            })),
            // Gom nội dung thô của tất cả bài trong cụm để Module sau đưa cho AI phân tích
            combined_text: c.articles.map(a => `[${a.source}] ${a.title}: ${a.summary}`).join('\n\n')
        };
    });

    // Sắp xếp các cụm theo độ nóng (số lượng bài viết nói về nó giảm dần)
    cleanClusters.sort((a, b) => b.article_count - a.article_count);

    console.log(`✅ Đã gom thành công ${cleanClusters.length} cụm sự kiện (Topic).`);
    return cleanClusters;
}

module.exports = { clusterArticles };
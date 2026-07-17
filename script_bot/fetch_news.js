const fs = require('fs');
const path = require('path');

// Import 5 module chúng ta vừa xây dựng
const { fetchAndNormalizeNews } = require('./modules/1_crawler');
const { generateEmbeddings } = require('./modules/2_embedding');
const { clusterArticles } = require('./modules/3_clustering');
const { processNLPForClusters } = require('./modules/4_nlp');
const { analyzeClusters } = require('./modules/5_ai_analysis');

// Trỏ đường dẫn lưu file ra thư mục gốc (luotlathedo)
const DATA_FILE_PATH = path.join(__dirname, '../news_data.json');

// Hàm tính thời gian để lọc tin cũ (chỉ giữ tin trong 7 ngày)
const getSevenDaysAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();

async function main() {
    try {
        console.log("=== BẮT ĐẦU QUY TRÌNH TÒA SOẠN AI CAO CẤP ===");
        
        // 1. Lấy và chuẩn hóa tin thô
        const rawArticles = await fetchAndNormalizeNews();
        if (rawArticles.length === 0) {
            console.log("Không có bài viết mới. Kết thúc quy trình.");
            process.exit(0);
        }

        // 2. Nhúng Vector bằng AI Embedding
        const embeddedArticles = await generateEmbeddings(rawArticles);

        // 3. Gom cụm sự kiện bằng Thuật toán Cosine Similarity
        const clusters = clusterArticles(embeddedArticles);

        // 4. Trích xuất Thực thể (NLP)
        const clustersWithEntities = processNLPForClusters(clusters);

        // 5. Gọi AI phân tích đa chiều (Gemini Flash)
        const finalAnalyzedClusters = await analyzeClusters(clustersWithEntities);

        // 6. Gộp dữ liệu cũ và xuất File JSON
        console.log("Bước 6: Gộp và lưu trữ dữ liệu ra Frontend...");
        let existingData = { news: [], last_updated: Date.now() };
        
        if (fs.existsSync(DATA_FILE_PATH)) {
            try {
                existingData = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf-8'));
            } catch (e) {
                console.log("File JSON cũ bị lỗi, hệ thống sẽ tạo file mới.");
            }
        }

        // Gắn mốc thời gian (timestamp) cho các sự kiện mới
        const newNews = finalAnalyzedClusters.map(cluster => ({
            ...cluster,
            timestamp: Date.now()
        }));

        // Gộp tin cũ + tin mới và lọc bỏ các tin đã quá 7 ngày
        const allNews = [...newNews, ...(existingData.news || [])]
            .filter(n => n.timestamp >= getSevenDaysAgo());

        // Cấu trúc Data chuẩn bị đẩy ra Frontend
        const finalDataset = {
            last_updated: Date.now(),
            stats: {
                last_run: Date.now(),
                total_crawled: rawArticles.length,
                total_processed: finalAnalyzedClusters.length
            },
            news: allNews
        };

        // Ghi đè nội dung mới vào file news_data.json
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(finalDataset, null, 2));
        console.log(`=== HOÀN TẤT: Đã cập nhật ${finalAnalyzedClusters.length} Topic mới vào news_data.json ===`);
        
    } catch (error) {
        console.error("❌ LỖI NGHIÊM TRỌNG TRONG QUY TRÌNH:", error);
        process.exit(1);
    }
}

// Kích hoạt hệ thống
main();
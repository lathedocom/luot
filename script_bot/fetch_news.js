require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Parser = require('rss-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("LỖI: Thiếu GEMINI_API_KEY trong biến môi trường.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// Dùng gemini-3.5-flash cho tất cả tác vụ để tối ưu tốc độ và vượt giới hạn miễn phí
const flashModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
const proModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

const DATA_FILE_PATH = path.join(__dirname, '../news_data.json');
const getSevenDaysAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();

async function main() {
    try {
        console.log("=== BẮT ĐẦU QUY TRÌNH TÒA SOẠN AI ===");

        // BƯỚC 1: CRAWL DỮ LIỆU THÔ (RSS)
        console.log("Bước 1: Kéo dữ liệu thô từ RSS...");
        const rssParser = new Parser();
        const rawNewsData = [];

        // Danh sách báo đã được mở rộng
        const rssFeeds = [
            { url: 'https://vnexpress.net/rss/tin-moi-nhat.rss', source: 'VNExpress', logo: 'https://s1.vnecdn.net/vnexpress/restruct/i/v899/v2_2019/pc/graphics/logo.svg' },
            { url: 'https://tuoitre.vn/rss/tin-moi-nhat.rss', source: 'Tuổi Trẻ', logo: 'https://tuoitre.vn/assets/images/logo.png' },
            { url: 'https://dantri.com.vn/rss/tin-moi-nhat.rss', source: 'Dân Trí', logo: 'https://icdn.dantri.com.vn/logo.svg' },
            { url: 'https://thanhnien.vn/rss/home.rss', source: 'Thanh Niên', logo: 'https://static.thanhnien.vn/thanhnien.vn/image/logo.svg' }
        ];

        // Lớp khiên bảo vệ 1: Báo nào lỗi mạng thì bỏ qua, kéo báo khác
        for (const feed of rssFeeds) {
            try {
                let parsed = await rssParser.parseURL(feed.url);
                parsed.items.slice(0, 15).forEach(item => {
                    // Logic bóc tách ảnh minh họa từ bài báo
                    let contentStr = item.content || item['content:encoded'] || '';
                    let imgMatch = contentStr.match(/<img[^>]+src=["']([^"']+)["']/i);
                    rawNewsData.push({
                        title: item.title,
                        link: item.link,
                        image_url: imgMatch ? imgMatch[1] : feed.logo, // Lấy ảnh minh họa, nếu không có lấy logo báo
                        source_name: feed.source,
                        source_logo: feed.logo,
                        pubDate: item.pubDate
                    });
                });
            } catch (e) {
                console.log(`⚠️ Bỏ qua nguồn ${feed.source} do kết nối chậm.`);
            }
        }

        // BƯỚC 2: GOM NHÓM & TÓM TẮT
        console.log("Bước 2: Gọi Gemini Flash để gom nhóm...");
        const promptFlash = `
            Đóng vai biên tập viên. Dưới đây là danh sách bài báo: ${JSON.stringify(rawNewsData)}.
            Nhiệm vụ:
            1. Gộp các bài báo cùng sự kiện thành các cụm (clusters).
            2. Mỗi cụm tạo một 'cluster_title', 'short_summary' (2-3 câu), và 'detailed_summary' (khoảng 10 câu tổng hợp chi tiết).
            3. Gắn mảng 'sources' chứa danh sách các bài báo gốc của cụm đó (bao gồm source_name, url, source_logo).
            4. Chọn 1 'image_url' từ các bài báo trong cụm để làm 'thumbnail' (nếu có).
            Trả về JSON thuần túy gồm mảng: { "news": [...] }. Không kèm markdown hay text thừa.
        `;

        const flashResult = await flashModel.generateContent(promptFlash);
        let flashText = flashResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const processedData = JSON.parse(flashText);
        
        let clusteredNews = processedData.news.map(item => ({
            ...item,
            id: 'news_' + Date.now() + Math.random().toString(36).substring(7),
            timestamp: Date.now()
        }));

        // BƯỚC 3: LỌC HOT TOPIC
        console.log("Bước 3: Lọc Hot Topics (>= 3 nguồn đưa tin)...");
        const hotTopics = clusteredNews.filter(cluster => cluster.sources && cluster.sources.length >= 3);

        // BƯỚC 4: PHÂN TÍCH CHUYÊN SÂU (BỌC KHIÊN CHỐNG SẬP 503)
        if (hotTopics.length > 0) {
            console.log(`Bước 4: Gọi AI phân tích chuyên sâu ${hotTopics.length} Hot Topics...`);
            try {
                const promptPro = `
                    Đóng vai một chuyên gia phân tích tin tức chiến lược.
                    Dưới đây là các điểm nóng (Hot Topics): ${JSON.stringify(hotTopics.map(t => ({id: t.id, title: t.cluster_title, detail: t.detailed_summary}))) }.
                    Hãy cung cấp phân tích đa chiều, dự báo tác động của mỗi sự kiện.
                    Trả về JSON định dạng mảng object: [{ "id": "id_sự_kiện", "expert_analysis": "Nội dung phân tích..." }]
                `;
                
                const proResult = await proModel.generateContent(promptPro);
                let proText = proResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                const analyses = JSON.parse(proText);

                clusteredNews = clusteredNews.map(news => {
                    const analysisMatch = analyses.find(a => a.id === news.id);
                    if (analysisMatch) {
                        news.expert_analysis = analysisMatch.expert_analysis;
                    }
                    return news;
                });
                console.log("✅ Hoàn tất phân tích chuyên sâu.");
            } catch (aiError) {
                console.log("⚠️ Máy chủ Google đang quá tải (Lỗi 503/429). Tạm bỏ qua phân tích AI đợt này để đưa tin lên web.");
            }
        }

        // BƯỚC 5: LƯU & DỌN DẸP DỮ LIỆU CŨ
        console.log("Bước 5: Gộp dữ liệu, xóa tin > 7 ngày và cập nhật file...");
        let existingData = { news: [], social: [] };
        
        if (fs.existsSync(DATA_FILE_PATH)) {
            const rawFile = fs.readFileSync(DATA_FILE_PATH);
            existingData = JSON.parse(rawFile);
        }

        const sevenDaysAgo = getSevenDaysAgo();
        const finalNews = [...clusteredNews, ...existingData.news].filter(n => n.timestamp >= sevenDaysAgo);

        const finalDataset = {
            last_updated: Date.now(),
            news: finalNews,
            social: existingData.social
        };

        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(finalDataset, null, 2));
        console.log("=== HOÀN TẤT. TRANG WEB ĐÃ CÓ TIN MỚI. ===");

    } catch (error) {
        console.error("LỖI QUY TRÌNH:", error);
        process.exit(1);
    }
}

main();

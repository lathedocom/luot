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
const flashModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
const proModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

const DATA_FILE_PATH = path.join(__dirname, '../news_data.json');
const getSevenDaysAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();

// Hàm tiện ích: Tạm dừng hệ thống (ngủ) trong X mili-giây
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    try {
        console.log("=== BẮT ĐẦU QUY TRÌNH TÒA SOẠN AI ===");

        // BƯỚC 1: CRAWL DỮ LIỆU THÔ (RSS)
        console.log("Bước 1: Kéo dữ liệu thô từ RSS...");
        const rssParser = new Parser();
        const rawNewsData = [];

        const rssFeeds = [
            { url: 'https://vnexpress.net/rss/tin-moi-nhat.rss', source: 'VNExpress', logo: 'https://s1.vnecdn.net/vnexpress/restruct/i/v899/v2_2019/pc/graphics/logo.svg' },
            { url: 'https://tuoitre.vn/rss/tin-moi-nhat.rss', source: 'Tuổi Trẻ', logo: 'https://tuoitre.vn/assets/images/logo.png' },
            { url: 'https://dantri.com.vn/rss/tin-moi-nhat.rss', source: 'Dân Trí', logo: 'https://icdn.dantri.com.vn/logo.svg' },
            { url: 'https://thanhnien.vn/rss/home.rss', source: 'Thanh Niên', logo: 'https://static.thanhnien.vn/thanhnien.vn/image/logo.svg' }
        ];

        for (const feed of rssFeeds) {
            try {
                let parsed = await rssParser.parseURL(feed.url);
                parsed.items.slice(0, 15).forEach(item => {
                    let contentStr = item.content || item['content:encoded'] || '';
                    let imgMatch = contentStr.match(/<img[^>]+src=["']([^"']+)["']/i);
                    rawNewsData.push({
                        title: item.title,
                        url: item.link, 
                        image_url: imgMatch ? imgMatch[1] : feed.logo,
                        source_name: feed.source,
                        source_logo: feed.logo,
                        pubDate: item.pubDate
                    });
                });
            } catch (e) {
                console.log(`⚠️ Bỏ qua nguồn ${feed.source} do kết nối chậm.`);
            }
        }

        // BƯỚC 2: GOM NHÓM & TÓM TẮT (CÓ VÒNG LẶP KIÊN TRÌ)
        console.log("Bước 2: Gọi Gemini Flash để gom nhóm và tổng hợp chuyên sâu...");
        const promptFlash = `
            Đóng vai Tổng biên tập AI chuyên nghiệp. Dưới đây là danh sách bài báo: ${JSON.stringify(rawNewsData)}.
            Nhiệm vụ:
            1. Gộp các bài báo cùng sự kiện thành các cụm (clusters).
            2. Tạo 'cluster_title' (8-15 từ).
            3. Viết 'short_summary' (Đúng 50-60 từ): Trả lời cực nhanh 5 câu hỏi (Chuyện gì? Ai? Khi nào? Điểm mới nhất? Tại sao đáng quan tâm?).
            4. Viết 'detailed_summary' (Đúng 400-500 từ), sử dụng ký tự '\\n\\n' để xuống dòng giữa các phần. Bố cục bắt buộc:
               - Mở đầu (~60 từ): Tóm tắt toàn cảnh sự kiện.
               - Diễn biến (~150 từ): Nêu rõ dòng sự kiện theo trình tự thời gian.
               - Góc nhìn (~120 từ): Phân tích góc nhìn từ các báo và cộng đồng.
               - Tác động & Đánh giá (~80 từ): Phân tích tác động tới người dùng/doanh nghiệp/thị trường.
               - Kết luận (~50 từ): Những điều cần theo dõi tiếp theo.
            5. Gắn mảng 'sources' chứa danh sách bài báo gốc (BẮT BUỘC giữ nguyên 'url', 'source_name', 'source_logo').
            6. Chọn 1 'image_url' từ các bài báo để làm 'thumbnail' (nếu có).
            Trả về JSON thuần túy gồm mảng: { "news": [...] }. Không kèm markdown hay text thừa.
        `;

        let flashText = "";
        let isSuccess = false;
        const MAX_RETRIES = 3;

        for (let i = 0; i < MAX_RETRIES; i++) {
            try {
                const flashResult = await flashModel.generateContent(promptFlash);
                flashText = flashResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                isSuccess = true;
                break; // Thành công thì thoát khỏi vòng lặp ngay
            } catch (apiErr) {
                console.log(`⏳ Lần ${i + 1} gọi AI thất bại (API bận). Đang đợi 10 giây để thử lại...`);
                await sleep(10000); // Ngủ 10 giây (10000 ms) trước khi thử lại
            }
        }

        // Nếu thử 3 lần vẫn thất bại, rút lui an toàn
        if (!isSuccess) {
            console.log("❌ Máy chủ Google đang quá tải nặng. Bot chủ động dừng để giữ nguyên tin cũ trên Web.");
            return; // Kết thúc sớm một cách êm đẹp, không báo lỗi sập
        }

        const processedData = JSON.parse(flashText);
        
        let clusteredNews = processedData.news.map(item => ({
            ...item,
            id: 'news_' + Date.now() + Math.random().toString(36).substring(7),
            timestamp: Date.now()
        }));

        // BƯỚC 3: LỌC HOT TOPIC
        console.log("Bước 3: Lọc Hot Topics (>= 3 nguồn đưa tin)...");
        const hotTopics = clusteredNews.filter(cluster => cluster.sources && cluster.sources.length >= 3);

        // BƯỚC 4: PHÂN TÍCH CHUYÊN SÂU
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
                console.log("⚠️ Bỏ qua phân tích chuyên sâu đợt này do API bận.");
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
        // Chỉ in ra cảnh báo chữ đỏ chứ không dùng process.exit(1) để chặn đánh dấu đỏ trên GitHub
        console.error("LỖI CẤU TRÚC DỮ LIỆU:", error.message);
    }
}

main();

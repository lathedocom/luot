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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    try {
        console.log("=== BẮT ĐẦU QUY TRÌNH TÒA SOẠN AI TOÀN CẦU ===");

        console.log("Bước 1: Kéo dữ liệu thô từ các đầu báo quốc tế và Việt Nam...");
        
        const rssParser = new Parser({
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const rawNewsData = [];

        const rssFeeds = [
            { url: 'https://vnexpress.net/rss/tin-moi-nhat.rss', source: 'VNExpress', logo: 'https://s1.vnecdn.net/vnexpress/restruct/i/v899/v2_2019/pc/graphics/logo.svg' },
            { url: 'https://tuoitre.vn/rss/tin-moi-nhat.rss', source: 'Tuổi Trẻ', logo: 'https://tuoitre.vn/assets/images/logo.png' },
            { url: 'https://dantri.com.vn/rss/tin-moi-nhat.rss', source: 'Dân Trí', logo: 'https://icdn.dantri.com.vn/logo.svg' },
            { url: 'https://baodautu.vn/tin-moi-nhat.rss', source: 'Báo Đầu Tư', logo: 'https://baodautu.vn/images/logo.png' },
            { url: 'https://cafef.vn/trang-chu.rss', source: 'CafeF', logo: 'https://cafef.vn/images/logo.png' },
            { url: 'https://vneconomy.vn/rss/kinh-te-vi-mo.rss', source: 'VnEconomy', logo: 'https://vneconomy.vn/images/logo.png' },
            { url: 'https://www.brandsvietnam.com/rss', source: 'Brands Vietnam', logo: 'https://www.brandsvietnam.com/images/logo.png' },
            { url: 'https://search.forbes.com/business/feed/', source: 'Forbes', logo: 'https://www.forbes.com/favicon.ico' },
            { url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', source: 'WSJ', logo: 'https://www.wsj.com/favicon.ico' },
            { url: 'https://www.economist.com/finance-and-economics/rss.xml', source: 'The Economist', logo: 'https://www.economist.com/favicon.ico' },
            { url: 'https://www.chinadaily.com.cn/rss/world_rss.xml', source: 'China Daily', logo: 'https://www.chinadaily.com.cn/favicon.ico' },
            { url: 'https://rsshub.app/caixin/latest', source: 'Caixin', logo: 'https://www.caixin.com/favicon.ico' },
            { url: 'https://rsshub.app/36kr/newsflashes', source: '36Kr', logo: 'https://36kr.com/favicon.ico' },
            { url: 'https://rsshub.app/sina/news/world', source: 'Sina News', logo: 'https://news.sina.com.cn/favicon.ico' },
            { url: 'https://rsshub.app/tencent/news/world', source: 'QQ News', logo: 'https://news.qq.com/favicon.ico' }
        ];

        for (const feed of rssFeeds) {
            try {
                const feedPromise = rssParser.parseURL(feed.url);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Quá thời gian 15s")), 15000));
                
                let parsed = await Promise.race([feedPromise, timeoutPromise]);
                
                parsed.items.slice(0, 5).forEach(item => {
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
                console.log(`⚠️ Bỏ qua nguồn ${feed.source} do kết nối chậm hoặc bị chặn.`);
            }
        }

        if (rawNewsData.length === 0) {
            console.log("❌ Không lấy được bài báo nào. Dừng quy trình.");
            process.exit(1);
        }

        console.log(`Bước 2: Gửi ${rawNewsData.length} tin thô cho AI dịch và lọc chủ đề...`);
        const promptFlash = `
            Đóng vai Tổng biên tập chiến lược AI. Dưới đây là danh sách bài báo thô đa ngôn ngữ: ${JSON.stringify(rawNewsData)}.
            Thực hiện CÁC QUY TẮC NGHIÊM NGẶT sau:
            
            1. BỘ LỌC CHỦ ĐỀ: CHỈ giữ lại sự kiện thuộc: Chính trị, Kinh tế, Tài chính, Ngoại giao, Văn hóa, Lối sống, Chính sách. LOẠI BỎ Giải trí, Thể thao.
            2. DỊCH THUẬT: Viết lại toàn bộ sang TIẾNG VIỆT chuẩn báo chí.
            3. GỘP NHÓM: Gộp bài báo cùng sự kiện thành cụm.
            4. TẠO NỘI DUNG:
               - 'cluster_title' (8-15 từ).
               - 'short_summary' (Đúng 50-60 từ).
               - 'detailed_summary' (Đúng 400-500 từ), dùng '\\n\\n' để ngắt đoạn. Bố cục: Mở đầu -> Diễn biến -> Góc nhìn -> Tác động -> Kết luận.
            5. Gắn mảng 'sources' chứa danh sách bài báo gốc (BẮT BUỘC giữ nguyên 'url', 'source_name', 'source_logo').
            6. Chọn 1 'image_url' từ các bài báo làm 'thumbnail'.
            
            Trả về JSON thuần túy gồm mảng: { "news": [...] }.
        `;

        let flashText = "";
        let isSuccess = false;
        
        for (let i = 0; i < 3; i++) {
            try {
                const flashResult = await flashModel.generateContent(promptFlash);
                flashText = flashResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                isSuccess = true;
                break; 
            } catch (apiErr) {
                console.log(`⏳ Lần ${i + 1} gọi AI thất bại. Đang đợi 10 giây để thử lại...`);
                await sleep(10000); 
            }
        }

        if (!isSuccess) {
            console.log("❌ Máy chủ AI quá tải. Dừng để giữ tin cũ.");
            process.exit(1);
        }

        const processedData = JSON.parse(flashText);
        let clusteredNews = processedData.news.map(item => ({
            ...item,
            id: 'news_' + Date.now() + Math.random().toString(36).substring(7),
            timestamp: Date.now()
        }));

        console.log("Bước 3: Lọc Hot Topics (>= 2 nguồn đưa tin)...");
        const hotTopics = clusteredNews.filter(cluster => cluster.sources && cluster.sources.length >= 2);

        if (hotTopics.length > 0) {
            console.log(`Bước 4: Gọi AI phân tích chuyên sâu ${hotTopics.length} Hot Topics...`);
            try {
                const hotTopicsForAI = hotTopics.map((t, index) => ({ ai_index: index, title: t.cluster_title, detail: t.detailed_summary }));
                const promptPro = `
                    Đóng vai chuyên gia phân tích vĩ mô. Điểm nóng: ${JSON.stringify(hotTopicsForAI)}.
                    Dự báo tác động kinh tế/chính trị bằng Tiếng Việt.
                    Trả về JSON: [{ "ai_index": số, "expert_analysis": "Phân tích..." }]
                `;
                const proResult = await proModel.generateContent(promptPro);
                let proText = proResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                const analyses = JSON.parse(proText);

                analyses.forEach(a => { if (hotTopics[a.ai_index]) hotTopics[a.ai_index].expert_analysis = a.expert_analysis; });
                console.log("✅ Hoàn tất phân tích chuyên sâu.");
            } catch (aiError) {
                console.log("⚠️ Bỏ qua phân tích chuyên sâu do mạng bận.");
            }
        }

        console.log("Bước 5: Gộp dữ liệu, xóa tin > 7 ngày và cập nhật file...");
        let existingData = { news: [], social: [] };
        if (fs.existsSync(DATA_FILE_PATH)) existingData = JSON.parse(fs.readFileSync(DATA_FILE_PATH));

        const sevenDaysAgo = getSevenDaysAgo();
        const finalNews = [...clusteredNews, ...existingData.news].filter(n => n.timestamp >= sevenDaysAgo);

        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify({ last_updated: Date.now(), news: finalNews, social: existingData.social }, null, 2));
        
        console.log("=== HOÀN TẤT. TRANG WEB ĐÃ CÓ TIN MỚI. ===");
        
        // CHỐT HẠ: Rút phích cắm, tắt ngay lập tức để GitHub hiện tích xanh ✅
        process.exit(0);

    } catch (error) {
        console.error("LỖI QUY TRÌNH:", error.message);
        process.exit(1);
    }
}

main();

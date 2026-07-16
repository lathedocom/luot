require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Parser = require('rss-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("LỖI: Thiếu GEMINI_API_KEY.");
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
        
        const rssParser = new Parser({
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        
        const rawNewsData = [];
        const failedSources = [];

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
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000));
                let parsed = await Promise.race([feedPromise, timeoutPromise]);
                
                parsed.items.slice(0, 5).forEach(item => {
                    let imgMatch = (item.content || item['content:encoded'] || '').match(/<img[^>]+src=["']([^"']+)["']/i);
                    rawNewsData.push({
                        title: item.title, url: item.link, 
                        image_url: imgMatch ? imgMatch[1] : feed.logo,
                        source_name: feed.source, source_logo: feed.logo, pubDate: item.pubDate
                    });
                });
            } catch (e) {
                console.log(`⚠️ Lỗi nguồn ${feed.source}`);
                failedSources.push(feed.source);
            }
        }

        if (rawNewsData.length === 0) process.exit(1);

        const promptFlash = `
            Đóng vai Tổng biên tập AI. Xử lý ${JSON.stringify(rawNewsData)}.
            1. BỘ LỌC: CHỈ giữ Kinh tế, Chính trị, Tài chính, Ngoại giao, Văn hóa, Chính sách. LOẠI Giải trí, Thể thao.
            2. DỊCH: Viết bằng TIẾNG VIỆT.
            3. GỘP: Gộp bài cùng sự kiện.
            4. FORMAT: 'cluster_title', 'short_summary' (50-60 từ), 'detailed_summary' (400-500 từ). Bố cục: Mở đầu -> Diễn biến -> Góc nhìn -> Tác động -> Kết luận.
            5. Gắn mảng 'sources' (url, source_name, source_logo).
            6. Chọn 'image_url' làm 'thumbnail'.
            Trả về JSON: { "news": [...] }
        `;

        let flashText = "";
        let isSuccess = false;
        
        for (let i = 0; i < 3; i++) {
            try {
                const flashResult = await flashModel.generateContent(promptFlash);
                flashText = flashResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                isSuccess = true;
                break; 
            } catch (apiErr) { await sleep(10000); }
        }

        if (!isSuccess) process.exit(1);

        const processedData = JSON.parse(flashText);
        let clusteredNews = processedData.news.map(item => ({
            ...item, id: 'news_' + Date.now() + Math.random().toString(36).substring(7), timestamp: Date.now()
        }));

        const hotTopics = clusteredNews.filter(cluster => cluster.sources && cluster.sources.length >= 2);
        if (hotTopics.length > 0) {
            try {
                const hotTopicsForAI = hotTopics.map((t, i) => ({ ai_index: i, title: t.cluster_title, detail: t.detailed_summary }));
                const promptPro = `Phân tích tác động kinh tế/chính trị: ${JSON.stringify(hotTopicsForAI)}. Trả về JSON: [{ "ai_index": số, "expert_analysis": "..." }]`;
                const proResult = await proModel.generateContent(promptPro);
                let proText = proResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                JSON.parse(proText).forEach(a => { if (hotTopics[a.ai_index]) hotTopics[a.ai_index].expert_analysis = a.expert_analysis; });
            } catch (aiError) { }
        }

        let existingData = { news: [], social: [] };
        if (fs.existsSync(DATA_FILE_PATH)) existingData = JSON.parse(fs.readFileSync(DATA_FILE_PATH));
        const finalNews = [...clusteredNews, ...existingData.news].filter(n => n.timestamp >= getSevenDaysAgo());

        const finalDataset = {
            last_updated: Date.now(),
            stats: {
                last_run: Date.now(),
                total_crawled: rawNewsData.length,
                total_processed: clusteredNews.length,
                failed_sources: failedSources
            },
            news: finalNews,
            social: existingData.social
        };

        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(finalDataset, null, 2));
        process.exit(0);
    } catch (error) { process.exit(1); }
}

main();

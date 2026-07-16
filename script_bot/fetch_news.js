require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) { console.error("LỖI: Thiếu GEMINI_API_KEY."); process.exit(1); }

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const flashModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
const proModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

const DATA_FILE_PATH = path.join(__dirname, '../news_data.json');
const getSevenDaysAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    try {
        console.log("=== BẮT ĐẦU QUY TRÌNH TÒA SOẠN AI CAO CẤP ===");
        
        const rssParser = new Parser({ timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const rawNewsData = [];
        const failedSources = [];

        // --- CA 1: GOM BÁO CHÍ (ĐÃ THÊM CÁC BÁO MỚI) ---
        const rssFeeds = [
            { url: 'https://vnexpress.net/rss/tin-moi-nhat.rss', source: 'VNExpress', logo: 'https://s1.vnecdn.net/vnexpress/restruct/i/v899/v2_2019/pc/graphics/logo.svg' },
            { url: 'https://vneconomy.vn/rss/kinh-te-vi-mo.rss', source: 'VnEconomy', logo: 'https://vneconomy.vn/images/logo.png' },
            { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664', source: 'CNBC', logo: 'https://www.cnbc.com/favicon.ico' },
            { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera', logo: 'https://www.aljazeera.com/favicon.ico' },
            { url: 'http://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC News', logo: 'https://www.bbc.co.uk/favicon.ico' },
            { url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', source: 'WSJ', logo: 'https://www.wsj.com/favicon.ico' },
            { url: 'https://www.economist.com/finance-and-economics/rss.xml', source: 'The Economist', logo: 'https://www.economist.com/favicon.ico' },
            { url: 'https://rsshub.app/caixin/latest', source: 'Caixin', logo: 'https://www.caixin.com/favicon.ico' }
        ];

        for (const feed of rssFeeds) {
            try {
                let parsed = await Promise.race([rssParser.parseURL(feed.url), new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 15000))]);
                parsed.items.slice(0, 4).forEach(item => {
                    rawNewsData.push({ title: item.title, url: item.link, source_name: feed.source, source_logo: feed.logo });
                });
            } catch (e) { failedSources.push(feed.source); }
        }

        let clusteredNews = [];
        if (rawNewsData.length > 0) {
            console.log("Dịch thuật & Lọc chủ đề (Ưu tiên Vĩ mô)...");
            const promptFlash = `
                Xử lý: ${JSON.stringify(rawNewsData)}.
                1. BỘ LỌC: CHỈ giữ Kinh tế, Chính trị, Tài chính. LOẠI Giải trí, Thể thao. Đánh giá cao phát ngôn của lãnh đạo cường quốc, tỷ phú kinh tế.
                2. DỊCH: Tiếng Việt.
                3. GỘP: Gộp bài cùng sự kiện.
                4. FORMAT: 'cluster_title', 'short_summary' (50 từ), 'detailed_summary' (400 từ).
                5. 'sources' (url, source_name, source_logo).
                Trả về JSON: { "news": [...] }
            `;
            let flashText = "";
            for (let i = 0; i < 3; i++) {
                try {
                    const res = await flashModel.generateContent(promptFlash);
                    flashText = res.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                    break; 
                } catch (e) { await sleep(10000); }
            }
            if (flashText) {
                clusteredNews = JSON.parse(flashText).news.map(item => ({
                    ...item, id: 'news_' + Date.now() + Math.random().toString(36).substring(7), timestamp: Date.now()
                }));
            }
        }

        // --- CA 2: MẠNG XÃ HỘI (CÓ YOUTUBE & ELON MUSK) ---
        console.log("Bước 6: Thu thập MXH & YouTube...");
        const rawSocialData = [];
        const socialFeeds = [
            { url: 'https://www.reddit.com/r/worldnews/top/.rss?t=day&limit=3', platform: 'Reddit', icon: 'https://www.redditinc.com/assets/images/site/reddit-logo.png' },
            { url: 'https://rsshub.app/twitter/user/elonmusk', platform: 'X (Elon Musk)', icon: 'https://abs.twimg.com/favicons/twitter.3.ico' }, // Lấy tweet của Elon Musk
            { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCIALMKvObZNtJ6AmdTo-85A', platform: 'YouTube', icon: 'https://www.youtube.com/favicon.ico' }, // Bloomberg Youtube
            { url: 'https://rsshub.app/weibo/search/hot', platform: 'Weibo', icon: 'https://upload.wikimedia.org/wikipedia/vi/a/a2/Sina_Weibo_logo.png' }
        ];

        for (const feed of socialFeeds) {
            try {
                let parsed = await Promise.race([rssParser.parseURL(feed.url), new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 10000))]);
                parsed.items.slice(0, 3).forEach(item => {
                    rawSocialData.push({ title: item.title, link: item.link, platform: feed.platform, icon: feed.icon });
                });
            } catch (e) { console.log(`⚠️ Bỏ qua MXH ${feed.platform}`); }
        }

        let processedSocial = [];
        if (rawSocialData.length > 0) {
            console.log("Dịch & Phân tích trọng số MXH...");
            const promptSocial = `
                MXH: ${JSON.stringify(rawSocialData)}.
                Dịch sang Tiếng Việt. 
                QUY TẮC: Ưu tiên phân tích sâu và giữ lại bài đăng của Donald Trump, Elon Musk hoặc lãnh đạo cường quốc. Lược bỏ hoặc tóm tắt cực ngắn những bài phát biểu mang tính hô hào chính trị chung chung (như của Zelensky nếu không có thông tin quân sự/tài chính thực tế).
                Trả về JSON: { "social": [ { "platform": "Tên", "icon": "Link", "content": "Tiếng Việt...", "link": "Link gốc" } ] }
            `;
            try {
                const socRes = await flashModel.generateContent(promptSocial);
                processedSocial = JSON.parse(socRes.response.text().replace(/```json/g, '').replace(/```/g, '').trim()).social.map(s => ({ ...s, timestamp: Date.now() }));
            } catch (e) { console.log("Lỗi dịch MXH"); }
        }

        // --- CA 3: LÀM BẢN TIN 24H (DAILY BRIEFING) ---
        console.log("Bước 7: AI phân tích Báo cáo vĩ mô 24h...");
        let dailyBriefingHTML = "";
        if (clusteredNews.length > 0) {
            try {
                const hotForBriefing = clusteredNews.slice(0, 8).map(n => n.short_summary); // Lấy 8 tin nóng nhất
                const promptBriefing = `
                    Dựa vào các sự kiện sau: ${JSON.stringify(hotForBriefing)}.
                    Hãy viết một "Bản Tin Tổng Hợp 24h" (Daily Briefing) cực kỳ sắc sảo. 
                    Nội dung cần phân tích rõ ảnh hưởng của các sự kiện tới: 
                    1. Thị trường/Kinh tế vĩ mô. 
                    2. Đối tượng liên quan (Doanh nghiệp, Quốc gia). 
                    3. Xã hội.
                    TRẢ VỀ DUY NHẤT MÃ HTML (dùng <h3>, <p>, <ul>, <li>). Không dùng Markdown.
                `;
                const briefRes = await proModel.generateContent(promptBriefing);
                dailyBriefingHTML = briefRes.response.text().replace(/```html/g, '').replace(/```/g, '').trim();
            } catch (e) { console.log("Lỗi tạo Bản tin 24h"); }
        }

        // --- BƯỚC CUỐI: LƯU TRỮ ---
        let existingData = { news: [], social: [], daily_briefing: "" };
        if (fs.existsSync(DATA_FILE_PATH)) existingData = JSON.parse(fs.readFileSync(DATA_FILE_PATH));
        
        const finalNews = [...clusteredNews, ...existingData.news].filter(n => n.timestamp >= getSevenDaysAgo());
        const finalSocial = [...processedSocial, ...(existingData.social || [])].slice(0, 20); 

        const finalDataset = {
            last_updated: Date.now(),
            stats: { last_run: Date.now(), total_crawled: rawNewsData.length, total_processed: clusteredNews.length, failed_sources: failedSources },
            daily_briefing: dailyBriefingHTML || existingData.daily_briefing, // Lưu bản tin 24h
            news: finalNews,
            social: finalSocial
        };

        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(finalDataset, null, 2));
        console.log("=== HOÀN TẤT VÀ ĐÃ LƯU ===");
        process.exit(0);
    } catch (error) { process.exit(1); }
}

main();

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) { console.error("LỖI: Thiếu GEMINI_API_KEY."); process.exit(1); }

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// BỘ LỌC THÉP: Tắt toàn bộ kiểm duyệt an toàn của AI (Rất quan trọng với tin Vĩ mô, Chiến tranh)
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
];

// Cập nhật model chuẩn gemini-1.5-flash
const flashModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });
const proModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });

const DATA_FILE_PATH = path.join(__dirname, '../news_data.json');
const getSevenDaysAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm bóc tách JSON thông minh chống lỗi cú pháp AI
function extractJSON(text) {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? match[0] : text;
}

async function main() {
    try {
        console.log("=== BẮT ĐẦU QUY TRÌNH TÒA SOẠN AI CAO CẤP ===");
        
        const rssParser = new Parser({ timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const rawNewsData = [];
        const failedSources = [];

        // --- CA 1: GOM BÁO CHÍ ---
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
            console.log(`Dịch & Gộp ${rawNewsData.length} tin thô...`);
            const promptFlash = `
                Xử lý: ${JSON.stringify(rawNewsData)}.
                1. BỘ LỌC: CHỈ giữ Kinh tế, Chính trị, Tài chính. LOẠI Giải trí, Thể thao. Đánh giá cao phát ngôn của lãnh đạo cường quốc, tỷ phú kinh tế.
                2. DỊCH: Tiếng Việt.
                3. GỘP: Gộp bài cùng sự kiện.
                4. FORMAT: 'cluster_title', 'short_summary' (50 từ), 'detailed_summary' (400 từ).
                5. 'sources' (url, source_name, source_logo).
                Trả về JSON: { "news": [...] }
            `;
            
            let jsonExtracted = null;
            // Cho phép AI thử lại 3 lần, in ra lỗi nếu sập
            for (let i = 0; i < 3; i++) {
                try {
                    const res = await flashModel.generateContent(promptFlash);
                    const parsed = JSON.parse(extractJSON(res.response.text()));
                    if (parsed && parsed.news) {
                        jsonExtracted = parsed;
                        break; 
                    }
                } catch (e) { 
                    console.log(`⏳ Lỗi AI đọc Tin tức (Lần ${i+1}): ${e.message}`); 
                    await sleep(5000); 
                }
            }
            
            if (jsonExtracted && jsonExtracted.news) {
                clusteredNews = jsonExtracted.news.map(item => ({
                    ...item, id: 'news_' + Date.now() + Math.random().toString(36).substring(7), timestamp: Date.now()
                }));
            }
        }

        // --- CA 2: MẠNG XÃ HỘI ---
        console.log("Bước 6: Thu thập MXH & YouTube...");
        const rawSocialData = [];
        const socialFeeds = [
            { url: 'https://www.reddit.com/r/worldnews/top/.rss?t=day&limit=3', platform: 'Reddit', icon: 'https://www.redditinc.com/assets/images/site/reddit-logo.png' },
            { url: 'https://rsshub.app/twitter/user/elonmusk', platform: 'X (Elon Musk)', icon: 'https://abs.twimg.com/favicons/twitter.3.ico' },
            { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCIALMKvObZNtJ6AmdTo-85A', platform: 'YouTube', icon: 'https://www.youtube.com/favicon.ico' },
            { url: 'https://rsshub.app/weibo/search/hot', platform: 'Weibo', icon: 'https://upload.wikimedia.org/wikipedia/vi/a/a2/Sina_Weibo_logo.png' }
        ];

        for (const feed of socialFeeds) {
            try {
                let parsed = await Promise.race([rssParser.parseURL(feed.url), new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 10000))]);
                parsed.items.slice(0, 3).forEach(item => {
                    rawSocialData.push({ title: item.title, link: item.link, platform: feed.platform, icon: feed.icon });
                });
            } catch (e) { failedSources.push(feed.platform); }
        }

        let processedSocial = [];
        if (rawSocialData.length > 0) {
            console.log("Dịch & Phân tích MXH...");
            const promptSocial = `
                MXH: ${JSON.stringify(rawSocialData)}.
                Dịch sang Tiếng Việt. 
                QUY TẮC: Ưu tiên phân tích sâu bài của Trump, Elon Musk hoặc lãnh đạo. Lược bỏ phát biểu chung chung (như của Zelensky nếu không có tin quân sự).
                Trả về JSON: { "social": [ { "platform": "Tên", "icon": "Link", "content": "Tiếng Việt...", "link": "Link" } ] }
            `;
            for (let i = 0; i < 3; i++) {
                try {
                    const socRes = await flashModel.generateContent(promptSocial);
                    processedSocial = JSON.parse(extractJSON(socRes.response.text())).social.map(s => ({ ...s, timestamp: Date.now() }));
                    break;
                } catch (e) { 
                    console.log(`⏳ Lỗi AI đọc MXH (Lần ${i+1}): ${e.message}`); 
                    await sleep(5000); 
                }
            }
        }

        // --- CA 3: BẢN TIN 24H ---
        console.log("Bước 7: AI tạo Báo cáo vĩ mô 24h...");
        let dailyBriefingHTML = "";
        if (clusteredNews.length > 0) {
            try {
                const hotForBriefing = clusteredNews.slice(0, 8).map(n => n.short_summary);
                const promptBriefing = `
                    Dựa vào các sự kiện: ${JSON.stringify(hotForBriefing)}.
                    Viết "Bản Tin Tổng Hợp 24h". 
                    Phân tích ảnh hưởng tới: 1. Kinh tế vĩ mô. 2. Đối tượng liên quan. 3. Xã hội.
                    TRẢ VỀ DUY NHẤT MÃ HTML (dùng <h3>, <p>, <ul>, <li>). Không Markdown.
                `;
                const briefRes = await proModel.generateContent(promptBriefing);
                dailyBriefingHTML = briefRes.response.text().replace(/```html/g, '').replace(/```/g, '').trim();
            } catch (e) { console.log("Lỗi tạo Bản tin 24h"); }
        }

        // --- LƯU TRỮ VÀ XUẤT THỐNG KÊ ---
        let existingData = { news: [], social: [], daily_briefing: "" };
        if (fs.existsSync(DATA_FILE_PATH)) {
            try { existingData = JSON.parse(fs.readFileSync(DATA_FILE_PATH)); } catch(e){}
        }
        
        const finalNews = [...clusteredNews, ...(existingData.news || [])].filter(n => n.timestamp >= getSevenDaysAgo());
        const finalSocial = [...processedSocial, ...(existingData.social || [])].slice(0, 20); 

        const finalDataset = {
            last_updated: Date.now(),
            stats: { 
                last_run: Date.now(), 
                total_crawled: rawNewsData.length, 
                total_processed: clusteredNews.length, 
                failed_sources: failedSources 
            },
            daily_briefing: dailyBriefingHTML || existingData.daily_briefing,
            news: finalNews,
            social: finalSocial
        };

        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(finalDataset, null, 2));
        console.log(`=== HOÀN TẤT: Thu thập ${rawNewsData.length} tin thô -> Sinh ra ${clusteredNews.length} cụm tin ===`);
        process.exit(0);
    } catch (error) { 
        console.error("LỖI QUY TRÌNH TỔNG:", error.message);
        process.exit(1); 
    }
}

main();

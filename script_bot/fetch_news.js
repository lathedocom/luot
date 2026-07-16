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
        console.log("=== BẮT ĐẦU QUY TRÌNH TÒA SOẠN AI TOÀN CẦU ===");
        
        const rssParser = new Parser({
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        const rawNewsData = [];
        const failedSources = [];

        // --- CA 1: GOM BÁO CHÍ ---
        const rssFeeds = [
            { url: 'https://vnexpress.net/rss/tin-moi-nhat.rss', source: 'VNExpress', logo: 'https://s1.vnecdn.net/vnexpress/restruct/i/v899/v2_2019/pc/graphics/logo.svg' },
            { url: 'https://tuoitre.vn/rss/tin-moi-nhat.rss', source: 'Tuổi Trẻ', logo: 'https://tuoitre.vn/assets/images/logo.png' },
            { url: 'https://dantri.com.vn/rss/tin-moi-nhat.rss', source: 'Dân Trí', logo: 'https://icdn.dantri.com.vn/logo.svg' },
            { url: 'https://baodautu.vn/tin-moi-nhat.rss', source: 'Báo Đầu Tư', logo: 'https://baodautu.vn/images/logo.png' },
            { url: 'https://cafef.vn/trang-chu.rss', source: 'CafeF', logo: 'https://cafef.vn/images/logo.png' },
            { url: 'https://vneconomy.vn/rss/kinh-te-vi-mo.rss', source: 'VnEconomy', logo: 'https://vneconomy.vn/images/logo.png' },
            { url: 'https://search.forbes.com/business/feed/', source: 'Forbes', logo: 'https://www.forbes.com/favicon.ico' },
            { url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', source: 'WSJ', logo: 'https://www.wsj.com/favicon.ico' },
            { url: 'https://www.economist.com/finance-and-economics/rss.xml', source: 'The Economist', logo: 'https://www.economist.com/favicon.ico' },
            { url: 'https://rsshub.app/caixin/latest', source: 'Caixin', logo: 'https://www.caixin.com/favicon.ico' },
            { url: 'https://rsshub.app/36kr/newsflashes', source: '36Kr', logo: 'https://36kr.com/favicon.ico' }
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
                        source_name: feed.source, source_logo: feed.logo
                    });
                });
            } catch (e) { failedSources.push(feed.source); }
        }

        let clusteredNews = [];
        if (rawNewsData.length > 0) {
            const promptFlash = `
                Đóng vai Tổng biên tập. Xử lý ${JSON.stringify(rawNewsData)}.
                1. BỘ LỌC: CHỈ giữ Kinh tế, Chính trị, Tài chính, Ngoại giao, Văn hóa, Chính sách. LOẠI Giải trí, Thể thao.
                2. DỊCH: Viết bằng TIẾNG VIỆT.
                3. GỘP: Gộp bài cùng sự kiện.
                4. FORMAT: 'cluster_title', 'short_summary' (50 từ), 'detailed_summary' (400 từ).
                5. Gắn mảng 'sources' (url, source_name, source_logo).
                6. Chọn 'image_url' làm 'thumbnail'.
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
                const hotTopics = clusteredNews.filter(c => c.sources && c.sources.length >= 2);
                if (hotTopics.length > 0) {
                    try {
                        const htForAI = hotTopics.map((t, i) => ({ ai_index: i, title: t.cluster_title, detail: t.detailed_summary }));
                        const pPro = `Phân tích tác động kinh tế/chính trị: ${JSON.stringify(htForAI)}. Trả về JSON: [{ "ai_index": số, "expert_analysis": "..." }]`;
                        const proRes = await proModel.generateContent(pPro);
                        JSON.parse(proRes.response.text().replace(/```json/g, '').replace(/```/g, '').trim()).forEach(a => { if (hotTopics[a.ai_index]) hotTopics[a.ai_index].expert_analysis = a.expert_analysis; });
                    } catch (e) {}
                }
            }
        }

        // --- CA 2: GOM MẠNG XÃ HỘI ---
        console.log("Bước 6: Thu thập dữ liệu Mạng xã hội...");
        const rawSocialData = [];
        const socialFeeds = [
            { url: 'https://www.reddit.com/r/worldnews/top/.rss?t=day&limit=3', platform: 'Reddit', icon: 'https://www.redditinc.com/assets/images/site/reddit-logo.png' },
            { url: 'https://www.reddit.com/r/Vietnam/top/.rss?t=day&limit=2', platform: 'Reddit VN', icon: 'https://www.redditinc.com/assets/images/site/reddit-logo.png' },
            // Dùng RSSHub cho Weibo Trending (Trung Quốc)
            { url: 'https://rsshub.app/weibo/search/hot', platform: 'Weibo', icon: 'https://upload.wikimedia.org/wikipedia/vi/a/a2/Sina_Weibo_logo.png' }
        ];

        for (const feed of socialFeeds) {
            try {
                const feedPromise = rssParser.parseURL(feed.url);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000));
                let parsed = await Promise.race([feedPromise, timeoutPromise]);
                
                parsed.items.slice(0, 3).forEach(item => {
                    rawSocialData.push({
                        title: item.title, link: item.link, platform: feed.platform, icon: feed.icon
                    });
                });
            } catch (e) { console.log(`⚠️ Bỏ qua MXH ${feed.platform}`); }
        }

        let processedSocial = [];
        if (rawSocialData.length > 0) {
            console.log("Dịch và chuẩn hóa format MXH...");
            const promptSocial = `
                Dưới đây là các bài đăng đang thịnh hành trên MXH: ${JSON.stringify(rawSocialData)}.
                Dịch nội dung sang tiếng Việt với văn phong thân thiện, ngắn gọn (như một dòng tweet).
                Trả về định dạng JSON mảng object: { "social": [ { "platform": "Tên MXH", "icon": "Link icon gốc", "content": "Nội dung tiếng Việt ngắn gọn...", "link": "Link gốc bài post" } ] }
            `;
            try {
                const socRes = await flashModel.generateContent(promptSocial);
                let socText = socRes.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                processedSocial = JSON.parse(socText).social.map(s => ({ ...s, timestamp: Date.now() }));
            } catch (e) { console.log("Lỗi dịch MXH"); }
        }

        // --- BƯỚC CUỐI: LƯU TRỮ ---
        let existingData = { news: [], social: [] };
        if (fs.existsSync(DATA_FILE_PATH)) existingData = JSON.parse(fs.readFileSync(DATA_FILE_PATH));
        
        const finalNews = [...clusteredNews, ...existingData.news].filter(n => n.timestamp >= getSevenDaysAgo());
        // Lọc giữ lại 20 bài MXH mới nhất để không làm nặng web
        const finalSocial = [...processedSocial, ...existingData.social].slice(0, 20); 

        const finalDataset = {
            last_updated: Date.now(),
            stats: {
                last_run: Date.now(),
                total_crawled: rawNewsData.length,
                total_processed: clusteredNews.length,
                failed_sources: failedSources
            },
            news: finalNews,
            social: finalSocial // Đã lưu dữ liệu MXH
        };

        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(finalDataset, null, 2));
        console.log("=== HOÀN TẤT ===");
        process.exit(0);
    } catch (error) { process.exit(1); }
}

main();

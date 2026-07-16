require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) { console.error("LỖI: Thiếu GEMINI_API_KEY."); process.exit(1); }

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
];

const jsonModel = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", 
    safetySettings,
    generationConfig: { responseMimeType: "application/json" }
});

const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });

const DATA_FILE_PATH = path.join(__dirname, '../news_data.json');
const getSevenDaysAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
            { url: 'https://www.economist.com/finance-and-economics/rss.xml', source: 'The Economist', logo: 'https://www.economist.com/favicon.ico' }
        ];

        for (const feed of rssFeeds) {
            try {
                let parsed = await Promise.race([rssParser.parseURL(feed.url), new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 15000))]);
                parsed.items.slice(0, 4).forEach(item => {
                    // SỬA LỖI MÙ THÔNG TIN: Cung cấp snippet để AI có dữ liệu viết bài
                    const snippetStr = (item.contentSnippet || item.content || '').substring(0, 200);
                    rawNewsData.push({ title: item.title, snippet: snippetStr, url: item.link, source_name: feed.source, source_logo: feed.logo });
                });
            } catch (e) { failedSources.push(feed.source); }
        }

        let clusteredNews = [];
        if (rawNewsData.length > 0) {
            console.log(`Đang phân tích ${rawNewsData.length} tin thô...`);
            const promptFlash = `
                Dữ liệu thô: ${JSON.stringify(rawNewsData)}.
                Nhiệm vụ: Gộp các bài cùng sự kiện. CHỈ chọn ra TỐI ĐA 8 SỰ KIỆN QUAN TRỌNG NHẤT (Vĩ mô, Tài chính).
                TRẢ VỀ ĐÚNG CẤU TRÚC JSON ARRAY SAU (Không bọc trong object nào khác):
                [
                  {
                    "cluster_title": "Tiêu đề tiếng Việt",
                    "short_summary": "Tóm tắt siêu nhanh 40 từ",
                    "detailed_summary": "Tóm tắt chi tiết 150 từ, chia 2 đoạn bằng \\n\\n",
                    "sources": [{"url": "...", "source_name": "...", "source_logo": "..."}],
                    "image_url": "Link ảnh hoặc bỏ trống"
                  }
                ]
            `;
            
            for (let i = 0; i < 3; i++) {
                try {
                    const res = await jsonModel.generateContent(promptFlash);
                    const rawText = res.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                    const parsed = JSON.parse(rawText);
                    
                    // SỬA LỖI JSON LINH HOẠT: Chấp nhận cả { "news": [...] } lẫn [...]
                    const newsArray = parsed.news ? parsed.news : (Array.isArray(parsed) ? parsed : null);

                    if (newsArray && newsArray.length > 0) {
                        clusteredNews = newsArray.map(item => ({
                            ...item, id: 'news_' + Date.now() + Math.random().toString(36).substring(7), timestamp: Date.now()
                        }));
                        console.log(`✅ Thành công! Đã tạo ${clusteredNews.length} cụm tin.`);
                        break; 
                    } else {
                        console.log(`⏳ Lần ${i+1}: AI trả về rỗng. Đang thử lại...`);
                    }
                } catch (e) { 
                    console.log(`⏳ Lỗi parse AI (Lần ${i+1}): ${e.message}`); 
                    await sleep(5000); 
                }
            }
        }

        // --- CA 2: PHÂN TÍCH CHUYÊN SÂU ---
        const hotTopics = clusteredNews.filter(cluster => cluster.sources && cluster.sources.length >= 2);
        if (hotTopics.length > 0) {
            console.log(`Phân tích chuyên sâu ${hotTopics.length} sự kiện...`);
            try {
                const hotTopicsForAI = hotTopics.map((t, index) => ({ ai_index: index, title: t.cluster_title, detail: t.detailed_summary }));
                const promptPro = `
                    Phân tích các sự kiện: ${JSON.stringify(hotTopicsForAI)}.
                    TRẢ VỀ JSON ARRAY:
                    [ { "ai_index": số, "expert_analysis": "Góc nhìn chuyên gia phân tích ngắn gọn..." } ]
                `;
                const proResult = await jsonModel.generateContent(promptPro);
                const parsedAnalyses = JSON.parse(proResult.response.text());
                const analyses = parsedAnalyses.expert_analysis ? parsedAnalyses.expert_analysis : (Array.isArray(parsedAnalyses) ? parsedAnalyses : []);
                
                analyses.forEach(a => { if (hotTopics[a.ai_index]) hotTopics[a.ai_index].expert_analysis = a.expert_analysis; });
            } catch (e) { console.log("⚠️ Bỏ qua phân tích chuyên sâu"); }
        }

        // --- CA 3: MẠNG XÃ HỘI ---
        console.log("Bước 6: Thu thập MXH...");
        const rawSocialData = [];
        const socialFeeds = [
            { url: 'https://www.reddit.com/r/worldnews/top/.rss?t=day&limit=3', platform: 'Reddit', icon: 'https://www.redditinc.com/assets/images/site/reddit-logo.png' },
            { url: 'https://rsshub.app/twitter/user/elonmusk', platform: 'X (Elon Musk)', icon: 'https://abs.twimg.com/favicons/twitter.3.ico' },
            { url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCIALMKvObZNtJ6AmdTo-85A', platform: 'YouTube', icon: 'https://www.youtube.com/favicon.ico' }
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
                Dịch sang tiếng Việt các bài MXH: ${JSON.stringify(rawSocialData)}. Ưu tiên phân tích sâu bài của Trump, Elon Musk.
                TRẢ VỀ JSON ARRAY:
                [ { "platform": "Tên", "icon": "Link", "content": "Nội dung...", "link": "Link" } ]
            `;
            for (let i = 0; i < 2; i++) {
                try {
                    const socRes = await jsonModel.generateContent(promptSocial);
                    const parsedSoc = JSON.parse(socRes.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
                    const socArray = parsedSoc.social ? parsedSoc.social : (Array.isArray(parsedSoc) ? parsedSoc : []);
                    
                    processedSocial = socArray.map(s => ({ ...s, timestamp: Date.now() }));
                    break;
                } catch (e) { await sleep(5000); }
            }
        }

        // --- CA 4: BẢN TIN 24H ---
        console.log("Bước 7: AI tạo Báo cáo vĩ mô 24h...");
        let dailyBriefingHTML = "";
        if (clusteredNews.length > 0) {
            try {
                const hotForBriefing = clusteredNews.slice(0, 6).map(n => n.short_summary);
                const promptBriefing = `
                    Dựa vào sự kiện: ${JSON.stringify(hotForBriefing)}.
                    Viết "Bản Tin Tổng Hợp 24h". Phân tích ảnh hưởng tới Kinh tế vĩ mô, Đối tượng liên quan, Xã hội.
                    TRẢ VỀ DUY NHẤT MÃ HTML (dùng <h3>, <p>, <ul>, <li>). Không Markdown.
                `;
                const briefRes = await textModel.generateContent(promptBriefing);
                dailyBriefingHTML = briefRes.response.text().replace(/```html/g, '').replace(/```/g, '').trim();
            } catch (e) { console.log("Lỗi tạo Bản tin 24h"); }
        }

        // --- LƯU TRỮ ---
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
        console.log(`=== HOÀN TẤT: Đã ghi thành công ${clusteredNews.length} bài vào file JSON ===`);
        process.exit(0);
    } catch (error) { 
        console.error("LỖI QUY TRÌNH TỔNG:", error.message);
        process.exit(1); 
    }
}

main();

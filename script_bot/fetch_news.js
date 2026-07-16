require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const { Groq } = require('groq-sdk'); // Khai báo thêm Groq

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY; // Lấy key Groq

if (!GEMINI_API_KEY) { 
    console.error("LỖI: Thiếu GEMINI_API_KEY."); 
    process.exit(1); 
}

// Khởi tạo Groq
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
];

// MODEL 1: Chuyên trả về JSON (Đã cấu hình gemini-3.5-flash theo yêu cầu)
const jsonModel = genAI.getGenerativeModel({ 
    model: "gemini-3.5-flash", 
    safetySettings,
    generationConfig: { responseMimeType: "application/json" }
});

// MODEL 2: Chuyên trả về Text/HTML (Dùng cho Bản tin 24h)
const textModel = genAI.getGenerativeModel({ 
    model: "gemini-3.5-flash", 
    safetySettings 
});

// HÀM GỌI AI THÔNG MINH CÓ CƠ CHẾ DỰ PHÒNG (FALLBACK)
async function askAI(prompt, isJson = true) {
    // Hàm phụ: Dọn dẹp câu chữ thừa, chỉ lấy đoạn JSON
    const extractJsonStr = (rawText) => {
        if (!isJson) return rawText;
        let text = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const start = Math.min(
            text.indexOf('{') !== -1 ? text.indexOf('{') : Infinity,
            text.indexOf('[') !== -1 ? text.indexOf('[') : Infinity
        );
        const end = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
        if (start !== Infinity && end !== -1) {
            return text.substring(start, end + 1);
        }
        return text;
    };

    try {
        // Ưu tiên 1: Gọi Gemini
        const model = isJson ? jsonModel : textModel;
        const res = await model.generateContent(prompt);
        return extractJsonStr(res.response.text());
    } catch (geminiError) {
        console.log(`⚠️ Gemini lỗi (${geminiError.status || 429}). Kích hoạt AI dự phòng (Groq)...`);
        
        if (!groq) {
            console.log("❌ Không có GROQ_API_KEY. Hệ thống dừng.");
            throw geminiError;
        }

        const finalPrompt = isJson 
            ? prompt + "\nLỆNH TUYỆT ĐỐI: CHỈ TRẢ VỀ ĐÚNG CẤU TRÚC JSON HỢP LỆ. KHÔNG CÓ BẤT CỨ VĂN BẢN NÀO BÊN NGOÀI." 
            : prompt;
        
        // Cấu hình Groq nâng cao: Cân đối Token để không dính lỗi 413
        const groqOptions = {
            messages: [{ role: "user", content: finalPrompt }],
            model: "llama-3.1-8b-instant",
            temperature: 0.1,
            max_tokens: 2500 // Điều chỉnh xuống 2500 để tổng yêu cầu dưới 6000 TPM
        };

        // Bật tính năng Native JSON Mode của Groq
        if (isJson) {
            groqOptions.response_format = { type: "json_object" };
        }
        
        const chatCompletion = await groq.chat.completions.create(groqOptions);
        return extractJsonStr(chatCompletion.choices[0].message.content);
    }
}
const DATA_FILE_PATH = path.join(__dirname, '../news_data.json');
const getSevenDaysAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// CỖ MÁY DÒ MÌN JSON: Tự động tìm mảng dữ liệu bất kể AI đặt tên là gì
function extractArrayFromAI(parsedObj) {
    if (Array.isArray(parsedObj)) return parsedObj;
    if (parsedObj && typeof parsedObj === 'object') {
        if (parsedObj.news && Array.isArray(parsedObj.news)) return parsedObj.news;
        if (parsedObj.social && Array.isArray(parsedObj.social)) return parsedObj.social;
        if (parsedObj.analyses && Array.isArray(parsedObj.analyses)) return parsedObj.analyses;
        // Nếu AI tự chế tên khác, mò tìm mảng đầu tiên
        for (let key in parsedObj) {
            if (Array.isArray(parsedObj[key])) return parsedObj[key];
        }
    }
    return null;
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
            { url: 'https://www.economist.com/finance-and-economics/rss.xml', source: 'The Economist', logo: 'https://www.economist.com/favicon.ico' }
        ];

        console.log("Bước 1: Thu thập RSS báo chí...");
        for (const feed of rssFeeds) {
            try {
                let parsed = await Promise.race([rssParser.parseURL(feed.url), new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 15000))]);
                parsed.items.slice(0, 4).forEach(item => {
                    const snippetStr = (item.contentSnippet || item.content || '').substring(0, 150);
                    rawNewsData.push({ title: item.title, snippet: snippetStr, url: item.link, source_name: feed.source, source_logo: feed.logo });
                });
            } catch (e) { failedSources.push("News: " + feed.source); }
        }

        let clusteredNews = [];
        if (rawNewsData.length > 0) {
            console.log(`Bước 2: Đang phân tích ${rawNewsData.length} tin thô...`);
            const promptFlash = `
                Dữ liệu: ${JSON.stringify(rawNewsData)}.
                Nhiệm vụ: Gộp các bài cùng sự kiện. CHỈ chọn ra TỐI ĐA 6 SỰ KIỆN QUAN TRỌNG NHẤT.
                TRẢ VỀ JSON:
                {
                  "news": [
                    {
                      "cluster_title": "Tiêu đề tiếng Việt",
                      "short_summary": "Tóm tắt 40 từ",
                      "detailed_summary": "Tóm tắt chi tiết 100 từ, chia 2 đoạn",
                      "sources": [{"url": "...", "source_name": "...", "source_logo": "..."}],
                      "image_url": "Link ảnh hoặc bỏ trống"
                    }
                  ]
                }
            `;
            
            for (let i = 0; i < 3; i++) {
                try {
                    // Đã thay thế gọi AI cũ bằng askAI
                    const cleanText = await askAI(promptFlash, true);
                    const parsed = JSON.parse(cleanText);
                    const newsArray = extractArrayFromAI(parsed); 

                    if (newsArray && newsArray.length > 0) {
                        clusteredNews = newsArray.map(item => ({
                            ...item, id: 'news_' + Date.now() + Math.random().toString(36).substring(7), timestamp: Date.now()
                        }));
                        console.log(`✅ Thành công! Đã tạo ${clusteredNews.length} cụm tin.`);
                        break; 
                    } else {
                        console.log(`⏳ Lần ${i+1}: AI trả về định dạng rỗng. Đang thử lại...`);
                    }
                } catch (e) { 
                    console.log(`⏳ Lỗi parse AI (Lần ${i+1}): ${e.message}`); 
                    await sleep(5000); 
                }
            }
        }

        // --- CA 2: PHÂN TÍCH CHUYÊN SÂU (GÓC NHÌN AI) ---
        const hotTopics = clusteredNews.slice(0, 4); 
        
        if (hotTopics.length > 0) {
            console.log(`Bước 3: Phân tích chuyên sâu (Góc nhìn AI) cho ${hotTopics.length} sự kiện...`);
            try {
                const hotTopicsForAI = hotTopics.map((t, index) => ({ 
                    id_tam: index + 1, 
                    title: t.cluster_title, 
                    detail: t.detailed_summary 
                }));
                
                const promptPro = `
                    Đóng vai chuyên gia vĩ mô, hãy phân tích sâu các sự kiện sau: ${JSON.stringify(hotTopicsForAI)}.
                    TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON SAU:
                    {
                        "analyses": [
                            {
                                "id_tam": 1, // BẮT BUỘC giữ nguyên số id_tam tương ứng với sự kiện
                                "expert_analysis": "Phân tích 80 từ về hệ quả, tác động sâu xa của sự kiện này..."
                            }
                        ]
                    }
                `;
                
                for (let i = 0; i < 2; i++) { 
                    try {
                        // Đã thay thế gọi AI cũ bằng askAI
                        const cleanText = await askAI(promptPro, true);
                        const parsedObj = JSON.parse(cleanText);
                        const analyses = extractArrayFromAI(parsedObj);
                        
                        if (analyses && analyses.length > 0) {
                            analyses.forEach(a => { 
                                const realIndex = parseInt(a.id_tam) - 1;
                                const targetNews = hotTopics[realIndex]; 
                                if (targetNews) {
                                    targetNews.expert_analysis = a.expert_analysis;
                                }
                            });
                            console.log(`✅ Đã thêm "Góc nhìn AI" thành công cho ${analyses.length} tin.`);
                            break;
                        }
                    } catch (err) {
                        console.log(`⏳ Lỗi AI phân tích chuyên sâu (Lần ${i+1}): ${err.message}`);
                        await sleep(3000);
                    }
                }
            } catch (e) { 
                console.log(`⚠️ Lỗi cấu hình AI phân tích chuyên sâu: ${e.message}`); 
            }
        }

       // --- CA 3: MẠNG XÃ HỘI ---
        console.log("Bước 4: Thu thập MXH...");
        const rawSocialData = [];
        
        const socialFeeds = [
            //{ url: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=VN', platform: 'Google Trends VN', icon: 'https://ssl.gstatic.com/trends_nrtr/3200_RC01/favicon.ico' },
            { url: 'https://hnrss.org/frontpage?points=100', platform: 'Hacker News (Tech)', icon: 'https://news.ycombinator.com/favicon.ico' },
            //{ url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCIALMKvObZNtJ6AmdTo-85A', platform: 'YouTube', icon: 'https://www.youtube.com/favicon.ico' }
        ];
        
        const socialParser = new Parser({ 
            timeout: 10000, 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } 
        });

        for (const feed of socialFeeds) {
            try {
                let parsed = await Promise.race([
                    socialParser.parseURL(feed.url), 
                    new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 10000))
                ]);
                
                parsed.items.slice(0, 3).forEach(item => {
                    let contentStr = (item.contentSnippet || item.content || item.title || '').substring(0, 300);
                    contentStr = contentStr.replace(/<[^>]*>?/gm, '').trim(); 
                    
                    rawSocialData.push({ 
                        title: item.title, 
                        content: contentStr, 
                        link: item.link, 
                        platform: feed.platform, 
                        icon: feed.icon 
                    });
                });
            } catch (e) { 
                console.log(`Lỗi tải nguồn MXH ${feed.platform}:`, e.message);
                failedSources.push("Social: " + feed.platform); 
            }
        }
        
        let processedSocial = [];
        if (rawSocialData.length > 0) {
            console.log("Bước 5: Dịch & Phân tích MXH...");
            const promptSocial = `Dịch sang tiếng Việt tóm tắt các bài MXH sau: ${JSON.stringify(rawSocialData)}. 
            TRẢ VỀ ĐỊNH DẠNG JSON: { "social": [ { "platform": "Tên", "icon": "Link", "content": "Nội dung bài viết...", "link": "Link" } ] }`;
            
            for (let i = 0; i < 2; i++) {
                try {
                    // Đã thay thế gọi AI cũ bằng askAI
                    const cleanText = await askAI(promptSocial, true);
                    const socArray = extractArrayFromAI(JSON.parse(cleanText));
                    
                    if (socArray && socArray.length > 0) {
                        processedSocial = socArray.map(s => ({ ...s, timestamp: Date.now() }));
                        console.log(`✅ Lấy thành công ${processedSocial.length} tin MXH.`);
                        break;
                    }
                } catch (e) { 
                    console.log(`⏳ Lỗi AI phân tích MXH (Lần ${i+1})...`);
                    await sleep(3000); 
                }
            }
        }

        // --- CA 4: SỰ KIỆN 24H ---
        console.log("Bước 6: AI tạo Báo cáo vĩ mô 24h...");
        let dailyBriefingHTML = "";
        if (clusteredNews.length > 0) {
            try {
                const hotForBriefing = clusteredNews.slice(0, 6).map(n => ({
                    tóm_tắt: n.short_summary,
                    góc_nhìn_AI: n.expert_analysis || "Chưa có phân tích sâu" 
                }));
                
                const promptBriefing = `
                    Dựa trên dữ liệu sự kiện và góc nhìn chuyên sâu sau: ${JSON.stringify(hotForBriefing)}.
                    Hãy viết "Bản Tin Tổng Hợp 24h" cực kỳ sắc sảo. Lồng ghép khéo léo "góc nhìn AI" vào từng sự kiện để bài viết có chiều sâu.
                    TRẢ VỀ DUY NHẤT MÃ HTML (dùng <h3>, <p>, <ul>, <li>, <strong>). KHÔNG bọc trong markdown.
                `;
                
                // Đã thay thế gọi AI cũ bằng askAI (truyền false để không force JSON)
                const briefText = await askAI(promptBriefing, false);
                dailyBriefingHTML = briefText.replace(/```html/g, '').replace(/```/g, '').trim();
            } catch (e) { console.log("Lỗi tạo Bản tin 24h", e.message); }
        }

        // --- LƯU TRỮ ---
        console.log("Bước 7: Lưu trữ dữ liệu...");
        let existingData = { news: [], social: [], daily_briefing: "" };
        if (fs.existsSync(DATA_FILE_PATH)) {
            try { existingData = JSON.parse(fs.readFileSync(DATA_FILE_PATH)); } catch(e){}
        }
        
        const finalNews = [...clusteredNews, ...(existingData.news || [])].filter(n => n.timestamp >= getSevenDaysAgo());
        const finalSocial = [...processedSocial, ...(existingData.social || [])].slice(0, 20); 

        const finalDataset = {
            last_updated: Date.now(),
            stats: { last_run: Date.now(), total_crawled: rawNewsData.length, total_processed: clusteredNews.length, failed_sources: failedSources },
            daily_briefing: dailyBriefingHTML || existingData.daily_briefing,
            news: finalNews,
            social: finalSocial
        };

        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(finalDataset, null, 2));
        console.log(`=== HOÀN TẤT: Sinh ra ${clusteredNews.length} cụm tin ===`);
        process.exit(0);
    } catch (error) { 
        console.error("LỖI QUY TRÌNH TỔNG:", error.message);
        process.exit(1); 
    }
}

main();

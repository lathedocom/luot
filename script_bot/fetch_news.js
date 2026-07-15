const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Parser = require('rss-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Khởi tạo các biến môi trường
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const RAPID_API_KEY = process.env.RAPID_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("LỖI: Thiếu GEMINI_API_KEY trong biến môi trường.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const flashModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
const proModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
const DATA_FILE_PATH = path.join(__dirname, '../news_data.json');

// Hàm tiện ích: Tính mốc thời gian 7 ngày trước
const getSevenDaysAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();

async function main() {
    try {
        console.log("=== BẮT ĐẦU QUY TRÌNH TÒA SOẠN AI ===");

        // BƯỚC 1: CRAWL DỮ LIỆU THÔ (RSS & SOCIAL)
        console.log("Bước 1: Kéo dữ liệu thô từ RSS và MXH...");
        const rssParser = new Parser();
        const rawNewsData = []; // Mảng chứa tin tức thô
        const rawSocialData = []; // Mảng chứa tin MXH thô

        // Crawl RSS (Cần mở rộng danh sách URL thực tế)
        const rssFeeds = [
            { url: 'https://vnexpress.net/rss/tin-moi-nhat.rss', source: 'VNExpress', logo: 'https://s1.vnecdn.net/vnexpress/restruct/i/v899/v2_2019/pc/graphics/logo.svg' },
            { url: 'https://tuoitre.vn/rss/tin-moi-nhat.rss', source: 'Tuổi Trẻ', logo: 'https://tuoitre.vn/assets/images/logo.png' },
            { url: 'https://dantri.com.vn/rss/tin-moi-nhat.rss', source: 'Dân Trí', logo: 'https://icdn.dantri.com.vn/logo.svg' },
            { url: 'https://thanhnien.vn/rss/home.rss', source: 'Thanh Niên', logo: 'https://static.thanhnien.vn/thanhnien.vn/image/logo.svg' }
        ];

        for (const feed of rssFeeds) {
            let parsed = await rssParser.parseURL(feed.url);
            parsed.items.slice(0, 15).forEach(item => {
                rawNewsData.push({
                    title: item.title,
                    link: item.link,
                    contentSnippet: item.contentSnippet,
                    source_name: feed.source,
                    source_logo: feed.logo,
                    pubDate: item.pubDate
                });
            });
        }

        // Mock lấy dữ liệu Social qua RapidAPI (Đổi URL/Headers theo API thực tế)
        /*
        const socialResponse = await axios.get('https://social-api.p.rapidapi.com/trending', {
            headers: { 'X-RapidAPI-Key': RAPID_API_KEY }
        });
        rawSocialData = socialResponse.data;
        */

        // BƯỚC 2: GOM NHÓM & DỊCH THUẬT (AI 1 - GEMINI FLASH)
        console.log("Bước 2: Gọi Gemini Flash để gom nhóm và dịch thuật...");
        
        const promptFlash = `
            Đóng vai biên tập viên. Dưới đây là danh sách bài báo thô: ${JSON.stringify(rawNewsData)}.
            Nhiệm vụ của bạn:
            1. Gộp các bài báo cùng nói về một sự kiện thành các cụm (clusters).
            2. Mỗi cụm tạo một 'cluster_title'.
            3. Viết 'short_summary' (2-3 câu).
            4. Viết 'detailed_summary' (khoảng 10 câu tổng hợp chi tiết).
            5. Gắn mảng 'sources' chứa danh sách các bài báo gốc của cụm đó.
            Đồng thời, với mảng MXH thô sau: ${JSON.stringify(rawSocialData)}, hãy dịch nội dung sang tiếng Việt thành 'translated_text'.
            Trả về JSON thuần túy gồm 2 mảng: { "news": [...], "social": [...] }. Không kèm markdown hay text thừa.
        `;

        const flashResult = await flashModel.generateContent(promptFlash);
        let flashText = flashResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const processedData = JSON.parse(flashText);
        
        let clusteredNews = processedData.news.map(item => ({
            ...item,
            id: 'news_' + Date.now() + Math.random().toString(36).substring(7),
            timestamp: Date.now()
        }));

        let translatedSocial = processedData.social.map(item => ({
            ...item,
            id: 'soc_' + Date.now() + Math.random().toString(36).substring(7),
            timestamp: Date.now()
        }));

        // BƯỚC 3: LỌC HOT TOPIC BẰNG JAVASCRIPT
        console.log("Bước 3: Lọc Hot Topics (>= 3 nguồn đưa tin)...");
        const hotTopics = clusteredNews.filter(cluster => cluster.sources && cluster.sources.length >= 3);

        // BƯỚC 4: PHÂN TÍCH CHUYÊN SÂU (AI 2 - GEMINI PRO)
        if (hotTopics.length > 0) {
            console.log(`Bước 4: Gọi Gemini Pro phân tích chuyên sâu ${hotTopics.length} Hot Topics...`);
            const promptPro = `
                Đóng vai một chuyên gia phân tích tin tức chiến lược.
                Dưới đây là các điểm nóng (Hot Topics): ${JSON.stringify(hotTopics.map(t => ({id: t.id, title: t.cluster_title, detail: t.detailed_summary})))}.
                Hãy cung cấp phân tích đa chiều, dự báo tác động của mỗi sự kiện.
                Trả về JSON định dạng mảng object: [{ "id": "id_sự_kiện", "expert_analysis": "Nội dung phân tích..." }]
            `;
            
            const proResult = await proModel.generateContent(promptPro);
            let proText = proResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const analyses = JSON.parse(proText);

            // Gắn phân tích vào tin tức tương ứng
            clusteredNews = clusteredNews.map(news => {
                const analysisMatch = analyses.find(a => a.id === news.id);
                if (analysisMatch) {
                    news.expert_analysis = analysisMatch.expert_analysis;
                }
                return news;
            });
        }

        // BƯỚC 5: LƯU & DỌN DẸP DỮ LIỆU CŨ
        console.log("Bước 5: Gộp dữ liệu, xóa tin > 7 ngày và ghi file...");
        let existingData = { news: [], social: [] };
        
        if (fs.existsSync(DATA_FILE_PATH)) {
            const rawFile = fs.readFileSync(DATA_FILE_PATH);
            existingData = JSON.parse(rawFile);
        }

        const sevenDaysAgo = getSevenDaysAgo();

        // Gộp và lọc
        const finalNews = [...clusteredNews, ...existingData.news].filter(n => n.timestamp >= sevenDaysAgo);
        const finalSocial = [...translatedSocial, ...existingData.social].filter(s => s.timestamp >= sevenDaysAgo);

        // Đảm bảo không trùng ID (Optional - Tùy logic nghiệp vụ)
        
        const finalDataset = {
            last_updated: Date.now(),
            news: finalNews,
            social: finalSocial
        };

        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(finalDataset, null, 2));
        console.log("=== HOÀN TẤT. DỮ LIỆU ĐÃ ĐƯỢC CẬP NHẬT. ===");

    } catch (error) {
        console.error("LỖI QUY TRÌNH:", error);
        process.exit(1);
    }
}

main();

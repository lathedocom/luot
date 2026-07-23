const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');
const { RSS_SOURCES } = require('../config/rss_sources');
const { generateHash } = require('./utils/hash'); 

const parser = new Parser({ 
    timeout: 20000, 
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Luot News Bot V4' }
});

const CACHE_FILE = path.join(__dirname, '../data/cache_urls.json');

if (!fs.existsSync(path.dirname(CACHE_FILE))) {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
}
if (!fs.existsSync(CACHE_FILE)) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify([]));
}

async function fetchAndNormalizeNews() {
    console.log(`Bước 1: Khởi động Crawler. Chuẩn bị quét ma trận ${RSS_SOURCES.length} nguồn tin...`);
    
    // TỐI ƯU 9: Dùng Set thay cho Array cho cachedUrls (Độ phức tạp O(1))
    let cachedUrlsArray = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    let cachedUrls = new Set(cachedUrlsArray);
    
    let newArticles = [];
    
    // TỐI ƯU 3: Khử trùng lặp tiêu đề trước khi embedding
    const seenTitles = new Set();
    
    // TỐI ƯU 7: Bộ lọc tiêu đề không mang giá trị sự kiện
    const skipKeywords = ["podcast", "video", "gallery", "photo", "live blog", "newsletter", "watch live", "opinion", "editorial"];
    
    // TỐI ƯU 4 & 2: Giới hạn tổng an toàn và Khung thời gian
    const DAILY_ARTICLE_LIMIT = 850;
    const HOURS_LIMIT = 6;
    const now = Date.now();

    // TỐI ƯU 5: Ưu tiên nguồn quan trọng (Sắp xếp theo priority giảm dần)
    const activeSources = RSS_SOURCES
        .filter(source => source.enabled)
        .sort((a, b) => b.priority - a.priority);

    for (const source of activeSources) {
        // TỐI ƯU 4: Ngắt hệ thống nếu chạm ngưỡng an toàn
        if (newArticles.length >= DAILY_ARTICLE_LIMIT) {
            console.log(`⚠️ Đã đạt giới hạn an toàn ${DAILY_ARTICLE_LIMIT} bài. Dừng Crawler để bảo vệ Quota Embedding.`);
            break;
        }

        try {
            console.log(`- Đang quét: ${source.name} (${source.country})`);
            const parsed = await parser.parseURL(source.rss);
            
            // TỐI ƯU 1: Giới hạn max_items tùy biến theo từng nguồn
            const maxItems = source.max_items || 8;
            
            // TỐI ƯU 2 & 6: Lọc bài cũ và cắt linh động
            const validItems = parsed.items.filter(item => {
                if (!item.pubDate) return true;
                const ageHours = (now - new Date(item.pubDate).getTime()) / 3600000;
                return ageHours <= HOURS_LIMIT;
            });

            const itemsToProcess = validItems.slice(0, maxItems);

            for (const item of itemsToProcess) {
                if (newArticles.length >= DAILY_ARTICLE_LIMIT) break;

                // Kiểm tra Cache siêu tốc O(1)
                if (cachedUrls.has(item.link)) continue;

                const titleLower = (item.title || "").toLowerCase();

                // TỐI ƯU 7: Bỏ qua tin rác
                if (skipKeywords.some(kw => titleLower.includes(kw))) {
                    cachedUrls.add(item.link); // Ném vào cache để lần sau khỏi xét lại
                    continue;
                }

                // TỐI ƯU 3: Lọc trùng lặp tiêu đề
                const normalizedTitle = titleLower.replace(/[^\w\s]/g, "").trim();
                if (seenTitles.has(normalizedTitle)) {
                    cachedUrls.add(item.link);
                    continue;
                }

                let snippetStr = (item.contentSnippet || item.content || '').substring(0, 250).replace(/\n/g, ' ').trim();

                // TỐI ƯU 8: Bỏ qua tin quá ngắn
                if (snippetStr.length < 60) {
                    cachedUrls.add(item.link);
                    continue;
                }

                // Chốt hạ: Đủ tiêu chuẩn đi tiếp
                seenTitles.add(normalizedTitle);

                newArticles.push({
                    id: generateHash(item.link),
                    title: item.title,
                    summary: snippetStr,
                    url: item.link,
                    publish_time: item.pubDate || new Date().toISOString(),
                    
                    source_name: source.name,
                    source_logo: source.logo,
                    source_country: source.country,
                    source_region: source.region,
                    source_language: source.language,
                    source_categories: source.category,
                    source_type: source.type,
                    source_credibility: source.credibility || 5,
                    source_priority: source.priority
                });

                cachedUrls.add(item.link);
            }
        } catch (error) {
            console.log(`❌ Bỏ qua [${source.name}]: Quá thời gian chờ hoặc lỗi mạng (${error.message})`);
        }
    }
    
    // Đảo ngược Set về Array và giới hạn 3000 url để lưu file
    cachedUrlsArray = Array.from(cachedUrls);
    if (cachedUrlsArray.length > 3000) cachedUrlsArray = cachedUrlsArray.slice(-3000);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cachedUrlsArray, null, 2));
    
    console.log(`✅ Crawler hoàn tất. Đã thu thập ${newArticles.length} bài viết chất lượng cao đưa vào Pipeline.`);
    return newArticles;
}

module.exports = { fetchAndNormalizeNews };

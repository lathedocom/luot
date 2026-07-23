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
    let cachedUrls = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    let newArticles = [];
    
    const activeSources = RSS_SOURCES.filter(source => source.enabled);
    
    for (const source of activeSources) {
        try {
            console.log(`- Đang quét: ${source.name} (${source.country})`);
            const parsed = await parser.parseURL(source.rss);
            
            parsed.items.slice(0, 8).forEach(item => {
                if (!cachedUrls.includes(item.link)) {
                    let snippetStr = (item.contentSnippet || item.content || '').substring(0, 250).replace(/\n/g, ' ').trim();
                    
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
                        source_credibility: source.credibility || 5, // ĐẢM BẢO LUÔN CÓ GIÁ TRỊ FALLBACK
                        source_priority: source.priority
                    });
                    
                    cachedUrls.push(item.link);
                }
            });
        } catch (error) {
            console.log(`❌ Bỏ qua [${source.name}]: Quá thời gian chờ hoặc lỗi mạng (${error.message})`);
        }
    }
    
    if (cachedUrls.length > 3000) cachedUrls = cachedUrls.slice(-3000);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cachedUrls, null, 2));
    
    console.log(`✅ Crawler hoàn tất. Đã thu thập và đóng gói metadata cho ${newArticles.length} bài viết mới.`);
    return newArticles;
}

module.exports = { fetchAndNormalizeNews };

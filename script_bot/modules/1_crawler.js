const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');
// Import Cấu trúc Nguồn tin ma trận từ file config
const { RSS_SOURCES } = require('../config/rss_sources');
const { generateHash } = require('./utils/hash'); // <-- BỔ SUNG DÒNG NÀY

// Tối ưu Crawler cho quy mô 200+ nguồn: Tăng timeout và thêm customFields để bắt ảnh
const parser = new Parser({ 
    timeout: 20000, // Tăng timeout lên 20s cho các báo nước ngoài
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Luot News Bot V4' }
});

const CACHE_FILE = path.join(__dirname, '../data/cache_urls.json');

// Khởi tạo thư mục và file cache nếu chưa có
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
    
    // Lọc chỉ lấy các nguồn đang được bật (enabled: true)
    const activeSources = RSS_SOURCES.filter(source => source.enabled);

    // Chạy đồng thời theo lô (Batching) hoặc tuần tự. Dùng tuần tự để an toàn cho RAM của GitHub Actions
    for (const source of activeSources) {
        try {
            console.log(`- Đang quét: ${source.name} (${source.country})`);
            const parsed = await parser.parseURL(source.rss);
            
            // Lấy 8 bài mới nhất mỗi nguồn (Để tránh bùng nổ số lượng khi có 200 nguồn)
            parsed.items.slice(0, 8).forEach(item => {
                if (!cachedUrls.includes(item.link)) {
                    let snippetStr = (item.contentSnippet || item.content || '').substring(0, 250).replace(/\n/g, ' ').trim();
                    
                    // Lắp ráp dữ liệu chuẩn với TẤT CẢ metadata từ ma trận nguồn
                    newArticles.push({
                        id: generateHash(item.link), // <-- BỔ SUNG DÒNG NÀY
                        title: item.title,
                        summary: snippetStr,
                        url: item.link,
                        publish_time: item.pubDate || new Date().toISOString(),
                        
                        // Metadata kế thừa trực tiếp từ rss_sources.js
                        source_name: source.name,
                        source_logo: source.logo,
                        source_country: source.country,
                        source_region: source.region,
                        source_language: source.language,
                        source_categories: source.category, // Mảng danh mục (VD: ["general", "economy"])
                        source_type: source.type,
                        source_credibility: source.credibility, // Rất quan trọng để tính điểm Trending
                        source_priority: source.priority
                    });
                    
                    cachedUrls.push(item.link);
                }
            });
        } catch (error) {
            console.log(`❌ Bỏ qua [${source.name}]: Quá thời gian chờ hoặc lỗi mạng (${error.message})`);
        }
    }

    // Cơ chế quản lý Cache thông minh: Giữ lại 3000 URL gần nhất (Vì 200 nguồn x 10 bài = 2000 bài/lần chạy)
    if (cachedUrls.length > 3000) cachedUrls = cachedUrls.slice(-3000);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cachedUrls, null, 2));
    
    console.log(`✅ Crawler hoàn tất. Đã thu thập và đóng gói metadata cho ${newArticles.length} bài viết mới.`);
    return newArticles;
}

module.exports = { fetchAndNormalizeNews };

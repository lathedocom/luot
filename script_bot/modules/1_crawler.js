const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser({ timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
// File cache sẽ lưu ở script_bot/data/cache_urls.json
const CACHE_FILE = path.join(__dirname, '../data/cache_urls.json');

// Khởi tạo file cache nếu chưa có
if (!fs.existsSync(path.dirname(CACHE_FILE))) {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
}
if (!fs.existsSync(CACHE_FILE)) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify([]));
}

// Danh sách các nguồn báo (Đã thêm region theo đặc tả của bạn)
const RSS_SOURCES = [
    [
  {
    url: 'https://vnexpress.net/rss/tin-moi-nhat.rss',
    region: 'Việt Nam',
    source_name: 'VNExpress',
    logo: 'https://s1.vnecdn.net/vnexpress/restruct/i/v937/v2_2019/pc/graphics/favicon.ico'
  },
  {
    url: 'https://vneconomy.vn/rss/kinh-te-vi-mo.rss',
    region: 'Việt Nam',
    source_name: 'VnEconomy',
    logo: 'https://vneconomy.vn/favicon.ico'
  },
  {
    url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664',
    region: 'Thế giới',
    source_name: 'CNBC',
    logo: 'https://www.cnbc.com/favicon.ico'
  },
  {
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    region: 'Thế giới',
    source_name: 'Al Jazeera',
    logo: 'https://www.aljazeera.com/favicon.ico'
  },
  {
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    region: 'Thế giới',
    source_name: 'BBC News',
    logo: 'https://www.bbc.co.uk/favicon.ico'
  },
  {
    url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
    region: 'Thế giới',
    source_name: 'The Wall Street Journal',
    logo: 'https://www.wsj.com/favicon.ico'
  },
  {
    url: 'https://www.economist.com/finance-and-economics/rss.xml',
    region: 'Thế giới',
    source_name: 'The Economist',
    logo: 'https://www.economist.com/favicon.ico'
  }
]
];

async function fetchAndNormalizeNews() {
    console.log("Bước 1: Bắt đầu thu thập RSS...");
    let cachedUrls = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    let newArticles = [];

    for (const feed of RSS_SOURCES) {
        try {
            const parsed = await parser.parseURL(feed.url);
            
            // Lấy 10 bài mới nhất mỗi nguồn
            parsed.items.slice(0, 10).forEach(item => {
                if (!cachedUrls.includes(item.link)) {
                    let snippetStr = (item.contentSnippet || item.content || '').substring(0, 200).replace(/\n/g, ' ').trim();
                    newArticles.push({
                        title: item.title,
                        summary: snippetStr,
                        url: item.link,
                        publish_time: item.pubDate || new Date().toISOString(),
                        source: feed.source_name,
                        region: feed.region
                    });
                    cachedUrls.push(item.link);
                }
            });
        } catch (error) {
            console.log(`❌ Lỗi tải RSS từ ${feed.source_name}:`, error.message);
        }
    }

    // Giữ lại 1000 URL gần nhất để file cache không bị quá nặng
    if (cachedUrls.length > 1000) cachedUrls = cachedUrls.slice(-1000);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cachedUrls, null, 2));

    console.log(`✅ Đã thu thập và chuẩn hóa ${newArticles.length} bài viết mới.`);
    return newArticles;
}

module.exports = { fetchAndNormalizeNews };

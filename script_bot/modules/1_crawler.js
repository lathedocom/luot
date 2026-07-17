const Parser = require('rss-parser');
const parser = new Parser({ timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
const RSS_SOURCES = require('../config/rss_sources');
const logger = require('./utils/logger');
const { normalizeDateToTimestamp } = require('./utils/date');
const { cleanHtmlTags, truncateText } = require('./utils/text');
const { generateHash } = require('./utils/hash');

async function fetchAndNormalizeNews() {
    logger.info("Bước 1: Bắt đầu Crawler & Normalize dữ liệu thô...");
    let newArticles = [];

    for (const feed of RSS_SOURCES) {
        try {
            const parsed = await parser.parseURL(feed.url);
            
            // Chỉ lấy 15 bài mới nhất mỗi báo để tránh phình dữ liệu
            parsed.items.slice(0, 15).forEach(item => {
                const rawSummary = item.contentSnippet || item.content || '';
                const cleanSummary = truncateText(cleanHtmlTags(rawSummary), 500);
                const cleanTitle = cleanHtmlTags(item.title);
                const articleUrl = item.link || '';
                
                if (!articleUrl) return;

                // CHUẨN HÓA ĐÚNG 14 TRƯỜNG SCHEMA
                const article = {
                    id: generateHash(articleUrl),
                    url: articleUrl,
                    source_name: feed.source_name,
                    source_logo: feed.source_logo,
                    source_country: feed.country || 'Global',
                    source_type: 'rss',
                    publish_time: normalizeDateToTimestamp(item.pubDate),
                    crawl_time: Date.now(),
                    language: feed.language || 'vi',
                    title: cleanTitle,
                    summary: cleanSummary,
                    thumbnail: item.enclosure ? item.enclosure.url : '',
                    content: "", // Giữ rỗng để sau này có thể mở rộng Crawl Full-text
                    tags: item.categories || []
                };
                
                newArticles.push(article);
            });
        } catch (error) {
            logger.error(`Lỗi tải RSS từ ${feed.source_name}`, error);
        }
    }
    
    logger.success(`Crawler hoàn tất. Thu được ${newArticles.length} bài viết chuẩn hóa.`);
    return newArticles;
}

module.exports = { fetchAndNormalizeNews };

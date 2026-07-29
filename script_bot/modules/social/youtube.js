// FILE: script_bot/modules/social/youtube.js
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { YOUTUBE_CHANNELS_TO_WATCH } = require('../../config/social_sources');

const CACHE_FILE = path.join(__dirname, '../../data/cache_youtube.json');

// SỬA Ở ĐÂY: Thêm Header User-Agent của người thật để lọt qua tường lửa YouTube
const parser = new Parser({ 
    timeout: 20000, // Chờ tối đa 20s
    customFields: {
        item: ['media:group', 'media:title', 'media:description']
    },
    headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
    }
});

function initCache() {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, JSON.stringify([]));
}

async function fetchYoutubeTrends() {
    if (!YOUTUBE_CHANNELS_TO_WATCH || YOUTUBE_CHANNELS_TO_WATCH.length === 0) return [];

    initCache();
    let cachedIds = new Set(JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')));
    const newTrends = [];

    logger.info(`[YouTube] Đang quét ${YOUTUBE_CHANNELS_TO_WATCH.length} kênh báo chí/tổ chức...`);

    for (const channel of YOUTUBE_CHANNELS_TO_WATCH) {
        try {
            // SỬ DỤNG CHUẨN MỚI: Bắt buộc dùng `channel_id=`
            const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`;
            
            const feed = await parser.parseURL(feedUrl);
            
            // Lấy video mới nhất để widget hiển thị
            const latestVideos = feed.items.slice(0, 1);

            for (const item of latestVideos) {
                const videoId = item.id || item.link;
                if (!videoId || cachedIds.has(videoId)) continue;

                newTrends.push({
                    keyword: channel.label,
                    summary: item.title,
                    source: 'youtube',
                    url: item.link,
                    timestamp: item.pubDate ? new Date(item.pubDate).getTime() : Date.now()
                });

                cachedIds.add(videoId);
            }
        } catch (error) {
            // SỬA Ở ĐÂY: In ra thông báo lỗi gốc để bạn biết bị chặn vì lý do gì (403, 404 hay 429)
            logger.warn(`[YouTube] Bỏ qua ${channel.label}: Lỗi mạng hoặc bị chặn (${error.message})`);
        }
        
        // SỬA Ở ĐÂY: Tăng thời gian giãn cách lên 2s để lách giới hạn Rate Limit của YouTube
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    let updatedCache = Array.from(cachedIds);
    if (updatedCache.length > 1000) updatedCache = updatedCache.slice(-1000);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(updatedCache, null, 2));

    logger.info(`[YouTube] Thu thập thành công ${newTrends.length} video mới.`);
    return newTrends;
}

module.exports = { fetchYoutubeTrends };

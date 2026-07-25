// FILE: script_bot/modules/social/youtube.js
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { YOUTUBE_CHANNELS_TO_WATCH } = require('../../config/social_sources');

const CACHE_FILE = path.join(__dirname, '../../data/cache_youtube.json');

const parser = new Parser({ timeout: 15000 });

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
            /* 
             * Mẹo OSINT: YouTube hỗ trợ 2 dạng RSS
             * 1. ID Kênh (bắt đầu bằng UC...): user/channel_id=UC...
             * 2. Tên người dùng cũ: user=Tên
             * Chúng ta dùng `user=` vì danh sách của bạn đa phần là username chuẩn.
             * GHI CHÚ: Nếu kênh nào không cào được, bạn cần đổi channelId trong file config 
             * thành chuẩn ID (VD: UCqvdSIvsOghg_0VdIg3M) và đổi tham số url bên dưới thành `channel_id=`
             */
            let feedUrl = `https://www.youtube.com/feeds/videos.xml?user=${channel.channelId}`;
            
            // Xử lý thông minh nếu user lỡ nhập ID kênh chuẩn (bắt đầu bằng UC)
            if (channel.channelId.startsWith('UC')) {
                feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`;
            }

            const feed = await parser.parseURL(feedUrl);
            
            // Chỉ lấy 1 video mới nhất để widget hiển thị gọn gàng
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
            // Tắt log đỏ chót để tránh rác console nếu kênh xài Handle mới thay vì Username
            logger.warn(`[YouTube] Lỗi cào kênh ${channel.label}: Không tìm thấy RSS hợp lệ.`);
        }
    }

    let updatedCache = Array.from(cachedIds);
    if (updatedCache.length > 1000) updatedCache = updatedCache.slice(-1000);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(updatedCache, null, 2));

    logger.info(`[YouTube] Thu thập thành công ${newTrends.length} video mới.`);
    return newTrends;
}

module.exports = { fetchYoutubeTrends };

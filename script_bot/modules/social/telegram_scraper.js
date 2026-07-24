// FILE: script_bot/modules/social/telegram_scraper.js
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { TELEGRAM_CHANNELS_TO_WATCH } = require('../../config/social_sources');

const CACHE_FILE = path.join(__dirname, '../../data/cache_telegram.json');

function initCache() {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, JSON.stringify([]));
}

async function fetchTelegramNews() {
    if (!TELEGRAM_CHANNELS_TO_WATCH || TELEGRAM_CHANNELS_TO_WATCH.length === 0) return [];

    initCache();
    let cachedMsgIds = new Set(JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')));
    const newTrends = [];

    logger.info(`[Telegram] Đang quét ${TELEGRAM_CHANNELS_TO_WATCH.length} kênh công khai...`);

    for (const channel of TELEGRAM_CHANNELS_TO_WATCH) {
        try {
            const previewUrl = `https://t.me/s/${channel.username}`;
            const response = await fetch(previewUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });

            if (!response.ok) {
                logger.warn(`[Telegram] Bỏ qua kênh ${channel.username} (Lỗi ${response.status})`);
                continue;
            }

            const html = await response.text();
            
            // Dùng Regex tìm các block tin nhắn (class tgme_widget_message)
            const messageBlockRegex = /<div class="tgme_widget_message_text[^>]*>(.*?)<\/div>/g;
            const linkRegex = /<a class="tgme_widget_message_date" href="(https:\/\/t\.me\/[^"]+)">/g;

            const messages = [...html.matchAll(messageBlockRegex)].map(m => m[1]);
            const links = [...html.matchAll(linkRegex)].map(m => m[1]);

            // Lấy 3-5 tin mới nhất (cuối mảng do HTML render từ cũ đến mới)
            const recentCount = Math.min(5, messages.length);
            for (let i = messages.length - recentCount; i < messages.length; i++) {
                if (i < 0) continue;
                
                const rawText = messages[i].replace(/<[^>]*>?/gm, '').trim(); // Strip HTML tags
                const msgLink = links[i] || `https://t.me/${channel.username}`;
                
                if (!rawText || cachedMsgIds.has(msgLink)) continue;

                newTrends.push({
                    keyword: channel.label,
                    summary: rawText.substring(0, 300),
                    source: 'telegram',
                    url: msgLink
                });

                cachedMsgIds.add(msgLink);
            }
        } catch (error) {
            logger.warn(`[Telegram] Lỗi quét kênh ${channel.username}: ${error.message}`);
        }
    }

    let updatedCache = Array.from(cachedMsgIds);
    if (updatedCache.length > 1000) updatedCache = updatedCache.slice(-1000);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(updatedCache, null, 2));

    logger.info(`[Telegram] Thu thập thành công ${newTrends.length} tin mới.`);
    return newTrends;
}

module.exports = { fetchTelegramNews };

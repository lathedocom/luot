// FILE: script_bot/modules/market/collector/parser_engine.js
const cheerio = require('cheerio');

function extractPriceFlexible(html, selectors, regexPattern) {
    const $ = cheerio.load(html);
    let matchedText = null;
    
    for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
            matchedText = elements.first().text().trim();
            break;
        }
    }
    
    if (!matchedText) {
        throw new Error("Không tìm thấy Selector nào khớp.");
    }
    
    const match = matchedText.match(regexPattern);
    if (!match) {
        throw new Error(`Bóc tách số thất bại: "${matchedText.substring(0, 50)}"`);
    }
    
    return match[1];
}

async function fetchHtmlSafe(url, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // Giả lập Googlebot để vượt qua một số tường lửa cơ bản
    const headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
    };

    try {
        const res = await fetch(url, { headers, signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        const html = await res.text();
        
        const htmlLower = html.toLowerCase();
        if (htmlLower.includes("cloudflare") || htmlLower.includes("access denied")) {
            throw new Error("Bị chặn bởi Firewall/Cloudflare.");
        }
        
        return html;
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}

/**
 * [MỚI] Sử dụng Proxy miễn phí để giấu IP của GitHub Actions
 */
async function fetchHtmlWithProxy(targetUrl, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // AllOrigins cho phép lấy HTML gốc mà không bị chặn CORS/IP
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    
    try {
        const res = await fetch(proxyUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: controller.signal 
        });
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error(`Proxy trả về HTTP ${res.status}`);
        return await res.text();
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}

module.exports = { extractPriceFlexible, fetchHtmlSafe, fetchHtmlWithProxy };

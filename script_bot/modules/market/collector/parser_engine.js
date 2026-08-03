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
    
    if (!matchedText) throw new Error("Không tìm thấy Selector nào khớp.");
    
    const match = matchedText.match(regexPattern);
    if (!match) throw new Error(`Bóc tách số thất bại: "${matchedText.substring(0, 50)}"`);
    
    return match[1];
}

async function fetchHtmlSafe(url, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
    };

    try {
        const res = await fetch(url, { headers, signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        const html = await res.text();
        
        if (html.toLowerCase().includes("cloudflare") || html.toLowerCase().includes("access denied")) {
            throw new Error("Bị chặn bởi Firewall/Cloudflare.");
        }
        
        return html;
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}

/**
 * [NÂNG CẤP] Cỗ máy Proxy đa tầng chống Timeout và chặn IP
 */
async function fetchHtmlWithProxy(targetUrl, timeoutMs = 25000) {
    // Danh sách các trạm trung chuyển miễn phí
    const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
    ];

    let lastError;
    
    for (const proxyUrl of proxies) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        try {
            const res = await fetch(proxyUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
            return await res.text();
        } catch (err) {
            clearTimeout(timeoutId);
            lastError = err;
            console.warn(`[Proxy Engine] Trạm trung chuyển lỗi, tự động đổi trạm...`);
        }
    }
    
    throw lastError; // Chỉ báo lỗi nếu TẤT CẢ các Proxy đều sập
}

/**
 * [MỚI] Hàm vượt rào dành riêng cho API (Trả về JSON)
 */
async function fetchJsonWithProxy(targetUrl, timeoutMs = 20000) {
    const textData = await fetchHtmlWithProxy(targetUrl, timeoutMs);
    return JSON.parse(textData);
}

module.exports = { extractPriceFlexible, fetchHtmlSafe, fetchHtmlWithProxy, fetchJsonWithProxy };

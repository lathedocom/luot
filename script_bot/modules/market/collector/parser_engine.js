// FILE: script_bot/modules/market/collector/parser_engine.js
const cheerio = require('cheerio');

/**
 * Trích xuất giá từ HTML bằng cách thử qua một danh sách các Selector
 * @param {string} html - Mã HTML của trang web
 * @param {Array} selectors - Danh sách các CSS selector cần thử
 * @param {RegExp} regexPattern - Biểu thức chính quy để lọc lấy số (VD: /([1-9][0-9]{0,3}[.,\s]?[0-9]{3})/)
 */
function extractPriceFlexible(html, selectors, regexPattern) {
    const $ = cheerio.load(html);
    let matchedText = null;
    
    for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
            matchedText = elements.first().text().trim();
            break; // Tìm thấy thì dừng lại ngay
        }
    }
    
    if (!matchedText) {
        throw new Error("Không tìm thấy Selector nào khớp với giao diện web hiện tại.");
    }
    
    const match = matchedText.match(regexPattern);
    if (!match) {
        throw new Error(`Bóc tách số thất bại trên đoạn text: "${matchedText.substring(0, 50)}"`);
    }
    
    return match[1];
}

/**
 * Hàm fetch an toàn với cơ chế giả lập trình duyệt và Timeout
 */
async function fetchHtmlSafe(url, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
    };

    try {
        const res = await fetch(url, { headers, signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        const html = await res.text();
        
        // Nhận diện chặn bởi Cloudflare hoặc Captcha
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

module.exports = { extractPriceFlexible, fetchHtmlSafe };

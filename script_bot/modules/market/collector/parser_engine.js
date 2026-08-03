// FILE: script_bot/modules/market/collector/parser_engine.js
const cheerio = require('cheerio');
const https = require('https');

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
 * Hàm Proxy dành riêng cho các trang HTML bị chặn IP (Như Trading Economics, Web Nông sản)
 */
async function fetchHtmlWithProxy(targetUrl, timeoutMs = 25000) {
    const proxies = [
        `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
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
            let data = await res.text();
            
            if (proxyUrl.includes('allorigins.win/get')) {
                const json = JSON.parse(data);
                if (!json.contents) throw new Error("AllOrigins rỗng");
                data = json.contents;
            }
            
            return data;
        } catch (err) {
            clearTimeout(timeoutId);
            lastError = err;
            console.warn(`[Proxy Engine] Trạm trung chuyển ${proxyUrl.split('/')[2]} lỗi, đổi trạm...`);
        }
    }
    throw lastError;
}

/**
 * [MỚI] Hàm Fetch JSON Trực tiếp cực nhanh, không qua Proxy, tự động bỏ qua lỗi SSL nội địa VN
 */
function fetchJsonDirect(url, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { 
            rejectUnauthorized: false, // Chỉ bỏ qua SSL cho riêng request này
            timeout: timeoutMs,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        }, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(new Error("Lỗi parse JSON")); }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

module.exports = { extractPriceFlexible, fetchHtmlSafe, fetchHtmlWithProxy, fetchJsonDirect };

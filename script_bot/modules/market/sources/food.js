// FILE: script_bot/modules/market/sources/food.js
const cheerio = require('cheerio');
const { fetchHtmlSafe } = require('../collector/parser_engine');

// Hàm trích xuất thông minh từ Google News với quy luật Tiền tệ cho Thực phẩm
async function extractFromGoogleNews(keyword, type) {
    const encodedQuery = encodeURIComponent(keyword);
    const gnUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=vi&gl=VN&ceid=VN:vi`;
    
    const xml = await fetchHtmlSafe(gnUrl, 10000);
    if (!xml || !xml.includes('<rss')) return null;

    const $ = cheerio.load(xml, { xmlMode: true });
    let newsItems = [];
    
    $('item').each((i, el) => {
        const title = $(el).find('title').text();
        const desc = $(el).find('description').text();
        const pubDate = new Date($(el).find('pubDate').text()).getTime();
        if ((title || desc) && !isNaN(pubDate)) {
            newsItems.push({ title, desc, pubDate });
        }
    });
    
    newsItems.sort((a, b) => b.pubDate - a.pubDate);
    
    for (const item of newsItems) {
        const fullText = (item.title + " " + item.desc).toLowerCase();
        
        if (type === 'rice') {
            // Nâng cấp: Cho phép bắt các số lẻ như 13.500, 14.500, 16.000
            let match = fullText.match(/(?:gạo tẻ|gạo trắng|giá gạo)[\s\S]{0,80}?(1[3-9][.,\s]?[0-9]{3}|2[0-5][.,\s]?[0-9]{3})\s*(?:đồng|đ|vnd|vnđ)\s*\/?\s*kg/i);
            
            // Fallback: Tìm số tiền + đồng/kg sát nhau
            if (!match) {
                 match = fullText.match(/(1[3-9][.,\s]?[0-9]{3}|2[0-5][.,\s]?[0-9]{3})\s*(?:đồng|đ|vnd|vnđ)\s*\/?\s*kg/i);
            }

            if (match) {
                let numInt = parseInt(match[1].replace(/[^\d]/g, ''));
                if (numInt >= 13000 && numInt <= 30000) {
                    return { val: numInt, url: gnUrl };
                }
            }
        }
        
        if (type === 'pork') {
            // Giá heo hơi vẫn chạy rất tốt (56.000 - 58.000)
            const match = fullText.match(/(?:heo hơi|lợn hơi)[\s\S]{0,80}?([5-8][0-9])[.,\s]?(?:000|k|nghìn)\s*(?:đồng|đ|vnd|vnđ)/i);
            if (match) {
                let numInt = parseInt(match[1].replace(/[^\d]/g, ''));
                return { val: numInt * 1000, url: gnUrl };
            }
        }

        if (type === 'egg') {
            // ƯU TIÊN 1: Bắt giá bán lẻ theo Hộp 10 quả / Chục (26.000 - 37.000)
            const boxMatch = fullText.match(/(2[5-9]|3[0-9])[.,\s]?(?:000|k|nghìn)[\s\S]{0,40}?(?:hộp|chục|10 quả)/i);
            if (boxMatch) {
                let numInt = parseInt(boxMatch[1].replace(/[^\d]/g, ''));
                return { val: (numInt * 1000) / 10, url: gnUrl }; // Tự chia 10 để ra giá 1 quả
            }

            // ƯU TIÊN 2: Bắt giá bán lẻ theo Quả (Siết chặt từ 2.200đ trở lên để né giá sỉ 1.800đ)
            const singleMatch = fullText.match(/([2-4][.,\s]?[0-9]{3})\s*(?:đồng|đ|vnd|vnđ)\s*\/?\s*quả/i);
            if (singleMatch) {
                let numInt = parseInt(singleMatch[1].replace(/[^\d]/g, ''));
                if (numInt >= 2200 && numInt <= 4500) {
                    return { val: numInt, url: gnUrl };
                }
            }
        }
    }
    return null;
}

// Mạng nhện từ khóa chuyên biệt (Né tin bán sỉ)
async function extractFoodPriceSpider(type) {
    const queries = type === 'rice' 
        ? ['"giá gạo tẻ"', '"giá gạo" "đồng/kg" "hôm nay"', '"giá lúa gạo" "đồng/kg"']
        : type === 'pork' 
        ? ['"giá heo hơi" "hôm nay"', '"giá lợn hơi" "đồng/kg"']
        : ['"giá trứng gà" "bán lẻ"', '"giá trứng gà" "hộp 10 quả"', '"giá trứng" "đồng/quả"'];
        
    for (let q of queries) {
        const result = await extractFromGoogleNews(q, type);
        if (result) return result; 
    }
    throw new Error("Không bắt được mức giá hợp lệ từ báo chí");
}

// ==========================================
// 1. MODULE GIÁ GẠO TẺ
// ==========================================
async function fetchRicePrice() {
    let rawResult = {
        indicator_id: "vn_rice",
        name: "Gạo tẻ thường",
        unit: "VNĐ/kg",
        country: "VN",
        frequency: "daily",
        retrieved_at: new Date().toISOString()
    };
    try {
        const result = await extractFoodPriceSpider('rice');
        return { ...rawResult, value: result.val, source: { name: "Báo chí (Google News)", url: result.url, type: "news_scraping" }, quality: { status: "verified", method: "google_spider" } };
    } catch (err) {
        return { ...rawResult, value: 16000, status: "offline_fallback", source: { name: "Giá tham chiếu", type: "fallback" }, quality: { status: "failed_but_cached", method: "hardcode", error_log: err.message } };
    }
}

// ==========================================
// 2. MODULE GIÁ THỊT HEO HƠI
// ==========================================
async function fetchPorkPrice() {
    let rawResult = {
        indicator_id: "vn_pork",
        name: "Thịt heo hơi",
        unit: "VNĐ/kg",
        country: "VN",
        frequency: "daily",
        retrieved_at: new Date().toISOString()
    };
    try {
        const result = await extractFoodPriceSpider('pork');
        return { ...rawResult, value: result.val, source: { name: "Báo chí (Google News)", url: result.url, type: "news_scraping" }, quality: { status: "verified", method: "google_spider" } };
    } catch (err) {
        return { ...rawResult, value: 57000, status: "offline_fallback", source: { name: "Giá tham chiếu", type: "fallback" }, quality: { status: "failed_but_cached", method: "hardcode", error_log: err.message } };
    }
}

// ==========================================
// 3. MODULE GIÁ TRỨNG GÀ
// ==========================================
async function fetchEggPrice() {
    let rawResult = {
        indicator_id: "vn_egg",
        name: "Trứng gà công nghiệp",
        unit: "VNĐ/quả",
        country: "VN",
        frequency: "daily",
        retrieved_at: new Date().toISOString()
    };
    try {
        const result = await extractFoodPriceSpider('egg');
        return { ...rawResult, value: result.val, source: { name: "Báo chí (Google News)", url: result.url, type: "news_scraping" }, quality: { status: "verified", method: "google_spider" } };
    } catch (err) {
        return { ...rawResult, value: 2600, status: "offline_fallback", source: { name: "Giá tham chiếu", type: "fallback" }, quality: { status: "failed_but_cached", method: "hardcode", error_log: err.message } };
    }
}

// ==========================================
// TEST LOCAL
// ==========================================
if (require.main === module) {
    console.log("🚀 Đang khởi động kiểm tra cào Thực phẩm Thiết yếu (Nâng cấp Retail & Fractional)...");
    Promise.all([fetchRicePrice(), fetchPorkPrice(), fetchEggPrice()]).then(results => {
        console.log("\n✅ [GẠO TẺ] KẾT QUẢ:", JSON.stringify(results[0], null, 2));
        console.log("\n✅ [HEO HƠI] KẾT QUẢ:", JSON.stringify(results[1], null, 2));
        console.log("\n✅ [TRỨNG GÀ] KẾT QUẢ:", JSON.stringify(results[2], null, 2));
    }).catch(console.error);
}

module.exports = { fetchRicePrice, fetchPorkPrice, fetchEggPrice };

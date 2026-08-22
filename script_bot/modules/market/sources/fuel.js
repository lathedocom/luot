// FILE: script_bot/modules/market/sources/fuel.js
const cheerio = require('cheerio');
const { fetchHtmlSafe } = require('../collector/parser_engine');

// Hàm trích xuất thông minh từ Google News với quy luật Chống Bẫy Số Chẵn Toàn Diện
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
    
    // Ưu tiên tin mới nhất
    newsItems.sort((a, b) => b.pubDate - a.pubDate);
    
    for (const item of newsItems) {
        const fullText = (item.title + " " + item.desc).toLowerCase();
        
        if (type === 'ron95') {
            const regex = /(?:95-iii|ron\s*95|xăng\s*95)[\s\S]{0,40}?(2[0-9][.,]?[0-9]{3})/gi;
            const matches = [...fullText.matchAll(regex)];
            
            for (let m of matches) {
                let numInt = parseInt(m[1].replace(/[^\d]/g, ''));
                if (numInt % 1000 === 0) continue; // Chống làm tròn
                if (numInt >= 20000 && numInt <= 30000) return { val: numInt, url: gnUrl };
            }
        }
        
        if (type === 'diesel') {
            const regex = /(?:0[.,]05s-ii|diesel|điêzen|dầu\s*do)[\s\S]{0,40}?(2[0-9][.,]?[0-9]{3})/gi;
            const matches = [...fullText.matchAll(regex)];
            
            for (let m of matches) {
                let numInt = parseInt(m[1].replace(/[^\d]/g, ''));
                if (numInt % 1000 === 0) continue; // Chống làm tròn
                if (numInt >= 20000 && numInt <= 35000) return { val: numInt, url: gnUrl };
            }
        }

        if (type === 'lpg') {
            // [ĐÃ SỬA] Không bắt buộc đuôi 000 nữa, cho phép đọc thẳng số lẻ VD: 518.400
            // Nâng dải giá lên 400.000 - 700.000 để phản ánh đúng lạm phát 2026
            const regex = /(?:12\s*kg|bình\s*12|gas\s*petrolimex)[\s\S]{0,60}?([4-6][0-9]{2}[.,\s]?[0-9]{3})/gi;
            const matches = [...fullText.matchAll(regex)];
            
            for (let m of matches) {
                let numStr = m[1].replace(/[^\d]/g, '');
                let numInt = parseInt(numStr);
                
                // [ĐÃ THÊM] BỘ LỌC CHỐNG LÀM TRÒN: Loại bỏ mọi số ảo như 400.000, 500.000 hay 600.000
                if (numInt % 1000 === 0) continue;
                
                // Dải giá an toàn của bình gas 12kg năm 2026
                if (numInt >= 400000 && numInt <= 700000) return { val: numInt, url: gnUrl };
            }
        }
    }
    return null;
}

// Mạng nhện từ khóa tung diện rộng
async function extractFuelPriceSpider(type) {
    const queries = type === 'ron95' 
        ? ['"giá xăng dầu" "hôm nay"', '"giá xăng" "E10 RON 95"']
        : type === 'diesel' 
        ? ['"giá xăng dầu" "hôm nay"', '"giá dầu DO 0,05S"']
        : ['"giá gas Petrolimex" "bình 12kg"', '"giá bán lẻ gas" "12kg"'];
        
    for (let q of queries) {
        const result = await extractFromGoogleNews(q, type);
        if (result) return result; 
    }
    throw new Error("Không bắt được mức giá hợp lệ từ thông cáo báo chí");
}

// ==========================================
// 1. MODULE XĂNG E10 RON 95-III
// ==========================================
async function fetchRon95Price() {
    let rawResult = {
        indicator_id: "vn_ron95",
        name: "Xăng E10 RON 95-III",
        unit: "VNĐ/lít",
        country: "VN",
        frequency: "weekly",
        retrieved_at: new Date().toISOString()
    };
    try {
        const result = await extractFuelPriceSpider('ron95');
        return { ...rawResult, value: result.val, source: { name: "Báo chí (Google News)", url: result.url, type: "news_scraping" }, quality: { status: "verified", method: "google_spider" } };
    } catch (err) {
        return { ...rawResult, value: 22660, status: "offline_fallback", source: { name: "Giá tham chiếu", type: "fallback" }, quality: { status: "failed_but_cached", method: "hardcode", error_log: err.message } };
    }
}

// ==========================================
// 2. MODULE DẦU DO 0,05S-II
// ==========================================
async function fetchDieselPrice() {
    let rawResult = {
        indicator_id: "vn_diesel",
        name: "Dầu DO 0,05S-II",
        unit: "VNĐ/lít",
        country: "VN",
        frequency: "weekly",
        retrieved_at: new Date().toISOString()
    };
    try {
        const result = await extractFuelPriceSpider('diesel');
        return { ...rawResult, value: result.val, source: { name: "Báo chí (Google News)", url: result.url, type: "news_scraping" }, quality: { status: "verified", method: "google_spider" } };
    } catch (err) {
        return { ...rawResult, value: 28540, status: "offline_fallback", source: { name: "Giá tham chiếu", type: "fallback" }, quality: { status: "failed_but_cached", method: "hardcode", error_log: err.message } };
    }
}

// ==========================================
// 3. MODULE GAS LPG 12KG
// ==========================================
async function fetchLpgPrice() {
    let rawResult = {
        indicator_id: "vn_lpg_12kg",
        name: "Gas LPG (Bình 12kg)",
        unit: "VNĐ/bình",
        country: "VN",
        frequency: "monthly",
        retrieved_at: new Date().toISOString()
    };
    try {
        const result = await extractFuelPriceSpider('lpg');
        return { ...rawResult, value: result.val, source: { name: "Báo chí (Google News)", url: result.url, type: "news_scraping" }, quality: { status: "verified", method: "google_spider" } };
    } catch (err) {
        return { ...rawResult, value: 518400, status: "offline_fallback", source: { name: "Giá tham chiếu", type: "fallback" }, quality: { status: "failed_but_cached", method: "hardcode", error_log: err.message } };
    }
}

// ==========================================
// TEST LOCAL
// ==========================================
if (require.main === module) {
    console.log("🚀 Đang khởi động kiểm tra cào Giá Nhiên Liệu (Anti-Rounding hoàn chỉnh)...");
    Promise.all([fetchRon95Price(), fetchDieselPrice(), fetchLpgPrice()]).then(results => {
        console.log("\n✅ [XĂNG E10 RON 95-III] KẾT QUẢ:", JSON.stringify(results[0], null, 2));
        console.log("\n✅ [DẦU DO 0,05S-II] KẾT QUẢ:", JSON.stringify(results[1], null, 2));
        console.log("\n✅ [GAS LPG 12KG] KẾT QUẢ:", JSON.stringify(results[2], null, 2));
    }).catch(console.error);
}

module.exports = { fetchRon95Price, fetchDieselPrice, fetchLpgPrice };

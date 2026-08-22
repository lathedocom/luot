// FILE: script_bot/modules/market/sources/utilities.js
const cheerio = require('cheerio');
const { fetchHtmlSafe } = require('../collector/parser_engine');

// Hàm trích xuất thông minh từ Google News (Chuyên săn tin Tăng giá điện/nước)
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
        
        if (type === 'electricity') {
            // Giá bán lẻ điện bình quân của EVN (Dao động từ 2.000đ - 2.500đ/kWh)
            // Nhận diện cả định dạng số thập phân: 2.006,79 hoặc 2006,79
            const match = fullText.match(/(?:giá điện bình quân|bán lẻ điện)[\s\S]{0,50}?(2[.,]?[0-9]{3}(?:[.,][0-9]{1,2})?)\s*(?:đồng|đ|vnd|vnđ)\s*\/?\s*kwh/i);
            if (match) {
                let numStr = match[1].replace(/[^\d]/g, '');
                // Do có thể chứa số thập phân (VD: 200679), ta chỉ lấy 4 chữ số đầu tiên làm phần nguyên
                let numInt = parseInt(numStr.substring(0, 4));
                if (numInt >= 2000 && numInt <= 2500) {
                    return { val: numInt, url: gnUrl };
                }
            }
        }
        
        if (type === 'water') {
            // Giá nước sạch sinh hoạt Bậc 1 (Dao động từ 6.000đ - 10.000đ/m3 tùy tỉnh thành)
            const match = fullText.match(/(?:giá nước sạch|nước sinh hoạt)[\s\S]{0,50}?([6-9][.,\s]?[0-9]{3}|1[0-2][.,\s]?[0-9]{3})\s*(?:đồng|đ|vnd|vnđ)\s*\/?\s*(?:m3|khối)/i);
            if (match) {
                let numInt = parseInt(match[1].replace(/[^\d]/g, ''));
                if (numInt >= 5000 && numInt <= 12000) {
                    return { val: numInt, url: gnUrl };
                }
            }
        }
    }
    return null;
}

// Mạng nhện từ khóa tung diện rộng
async function extractUtilitiesSpider(type) {
    const queries = type === 'electricity' 
        ? ['"giá bán lẻ điện bình quân" "đồng/kWh"', '"EVN tăng giá điện" "đồng"']
        : ['"giá nước sinh hoạt" "đồng/m3"', '"giá nước sạch" "hộ dân" "đồng"'];
        
    for (let q of queries) {
        const result = await extractFromGoogleNews(q, type);
        if (result) return result; 
    }
    throw new Error("Không có thông cáo thay đổi giá Điện/Nước mới");
}

// ==========================================
// 1. MODULE GIÁ ĐIỆN SINH HOẠT (EVN)
// ==========================================
async function fetchElectricityPrice() {
    let rawResult = {
        indicator_id: "vn_electricity",
        name: "Giá điện sinh hoạt (Bình quân)",
        unit: "VNĐ/kWh",
        country: "VN",
        frequency: "monthly",
        retrieved_at: new Date().toISOString()
    };
    try {
        const result = await extractUtilitiesSpider('electricity');
        return { ...rawResult, value: result.val, source: { name: "Thông cáo Báo chí", url: result.url, type: "news_scraping" }, quality: { status: "verified", method: "google_spider" } };
    } catch (err) {
        // Giá tĩnh tiêu chuẩn của EVN (Áp dụng đến giữa năm 2026)
        return { ...rawResult, value: 2006, status: "offline_fallback", source: { name: "Giá tham chiếu (EVN)", type: "fallback" }, quality: { status: "failed_but_cached", method: "hardcode", error_log: err.message } };
    }
}

// ==========================================
// 2. MODULE GIÁ NƯỚC SINH HOẠT
// ==========================================
async function fetchWaterPrice() {
    let rawResult = {
        indicator_id: "vn_water",
        name: "Giá nước sinh hoạt (Bậc 1)",
        unit: "VNĐ/m³",
        country: "VN",
        frequency: "monthly",
        retrieved_at: new Date().toISOString()
    };
    try {
        const result = await extractUtilitiesSpider('water');
        return { ...rawResult, value: result.val, source: { name: "Thông cáo Báo chí", url: result.url, type: "news_scraping" }, quality: { status: "verified", method: "google_spider" } };
    } catch (err) {
        // Giá tĩnh trung bình Bậc 1 tại các thành phố lớn
        return { ...rawResult, value: 8500, status: "offline_fallback", source: { name: "Giá tham chiếu (Trung bình nội thành)", type: "fallback" }, quality: { status: "failed_but_cached", method: "hardcode", error_log: err.message } };
    }
}

// ==========================================
// TEST LOCAL
// ==========================================
if (require.main === module) {
    console.log("🚀 Đang khởi động kiểm tra cào Giá Tiện ích (Điện, Nước)...");
    Promise.all([fetchElectricityPrice(), fetchWaterPrice()]).then(results => {
        console.log("\n✅ [GIÁ ĐIỆN] KẾT QUẢ:", JSON.stringify(results[0], null, 2));
        console.log("\n✅ [GIÁ NƯỚC] KẾT QUẢ:", JSON.stringify(results[1], null, 2));
    }).catch(console.error);
}

module.exports = { fetchElectricityPrice, fetchWaterPrice };

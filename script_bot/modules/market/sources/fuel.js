// FILE: script_bot/modules/market/sources/fuel.js
const cheerio = require('cheerio');
const { fetchHtmlSafe } = require('../collector/parser_engine');

// ==========================================
// HÀM CÀO TRỰC TIẾP TỪ BẢNG GIÁ BÁO MỚI (CHÍNH XÁC 100%)
// ==========================================
async function fetchFuelFromBaomoi(type) {
    const url = 'https://baomoi.com/tien-ich-gia-xang-dau.epi';
    
    // Thử cào trực tiếp trước
    let html = await fetchHtmlSafe(url, 10000);
    
    // Nếu bị chặn, đi vòng qua Proxy AllOrigins
    if (!html) {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        html = await fetchHtmlSafe(proxyUrl, 10000);
    }
    
    if (!html) throw new Error("Không truy cập được trang Tiện ích Báo Mới");

    const $ = cheerio.load(html);
    let finalPrice = null;

    // Quét toàn bộ các ô trong bảng
    $('td').each((i, el) => {
        const text = $(el).text().trim().toLowerCase();
        
        if (type === 'ron95' && text.includes('ron 95-iii')) {
            // Lấy giá trị ở cột tiếp theo (Giá vùng 1)
            const priceText = $(el).next('td').text().trim();
            finalPrice = parseInt(priceText.replace(/[^\d]/g, ''));
        } 
        else if (type === 'diesel' && text.includes('0,05s-ii')) {
            // Lấy giá trị ở cột tiếp theo (Giá vùng 1)
            const priceText = $(el).next('td').text().trim();
            finalPrice = parseInt(priceText.replace(/[^\d]/g, ''));
        }
    });

    if (finalPrice) return { val: finalPrice, url: url };
    throw new Error("Không tìm thấy dòng dữ liệu trong bảng Báo Mới");
}

// ==========================================
// HÀM CÀO GAS LPG (GIỮ NGUYÊN TỪ GOOGLE NEWS)
// ==========================================
async function extractLpgFromGoogleNews() {
    const queries = ['"giá gas Petrolimex" "bình 12kg"', '"giá bán lẻ gas" "12kg"'];
    for (let q of queries) {
        const encodedQuery = encodeURIComponent(q);
        const gnUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=vi&gl=VN&ceid=VN:vi`;
        const xml = await fetchHtmlSafe(gnUrl, 8000);
        if (!xml) continue;
        
        const $ = cheerio.load(xml, { xmlMode: true });
        let newsItems = [];
        $('item').each((i, el) => {
            const pubDate = new Date($(el).find('pubDate').text()).getTime();
            if (!isNaN(pubDate)) newsItems.push({ 
                title: $(el).find('title').text(), 
                desc: $(el).find('description').text(), 
                pubDate 
            });
        });
        
        newsItems.sort((a, b) => b.pubDate - a.pubDate);
        
        for (const item of newsItems) {
            const fullText = (item.title + " " + item.desc).toLowerCase();
            const regex = /(?:12\s*kg|bình\s*12|gas\s*petrolimex)[\s\S]{0,100}?([4-6][0-9]{2}[.,\s]?[0-9]{3})/gi;
            let matches = [...fullText.matchAll(regex)];
            for (let m of matches) {
                let numInt = parseInt(m[1].replace(/[^\d]/g, ''));
                if (numInt % 1000 === 0) continue;
                if (numInt >= 400000 && numInt <= 700000) return { val: numInt, url: gnUrl };
            }
        }
    }
    throw new Error("Không quét được Gas từ báo chí");
}

// ==========================================
// MODULE CHÍNH
// ==========================================
async function fetchRon95Price() {
    let rawResult = { indicator_id: "vn_ron95", name: "Xăng E10 RON 95-III", unit: "VNĐ/lít", country: "VN", frequency: "weekly", retrieved_at: new Date().toISOString() };
    try {
        const result = await fetchFuelFromBaomoi('ron95');
        return { ...rawResult, value: result.val, source: { name: "Báo Mới Tiện Ích", url: result.url, type: "html_table" }, quality: { status: "verified", method: "direct_scrape" } };
    } catch (err) { return { ...rawResult, value: 60, status: "offline_fallback", source: { name: "Giá tham chiếu", type: "fallback" }, quality: { status: "failed_but_cached", method: "hardcode", error_log: err.message } }; }
}

async function fetchDieselPrice() {
    let rawResult = { indicator_id: "vn_diesel", name: "Dầu DO 0,05S-II", unit: "VNĐ/lít", country: "VN", frequency: "weekly", retrieved_at: new Date().toISOString() };
    try {
        const result = await fetchFuelFromBaomoi('diesel');
        return { ...rawResult, value: result.val, source: { name: "Báo Mới Tiện Ích", url: result.url, type: "html_table" }, quality: { status: "verified", method: "direct_scrape" } };
    } catch (err) { return { ...rawResult, value: 40, status: "offline_fallback", source: { name: "Giá tham chiếu", type: "fallback" }, quality: { status: "failed_but_cached", method: "hardcode", error_log: err.message } }; }
}

async function fetchLpgPrice() {
    let rawResult = { indicator_id: "vn_lpg_12kg", name: "Gas LPG (Bình 12kg)", unit: "VNĐ/bình", country: "VN", frequency: "monthly", retrieved_at: new Date().toISOString() };
    try {
        const result = await extractLpgFromGoogleNews();
        return { ...rawResult, value: result.val, source: { name: "Google News", url: result.url, type: "news_scraping" }, quality: { status: "verified", method: "spider" } };
    } catch (err) { return { ...rawResult, value: 518400, status: "offline_fallback", source: { name: "Giá tham chiếu", type: "fallback" }, quality: { status: "failed_but_cached", method: "hardcode", error_log: err.message } }; }
}

module.exports = { fetchRon95Price, fetchDieselPrice, fetchLpgPrice };

// FILE: script_bot/modules/market/sources/agriculture.js
const cheerio = require('cheerio');

// Lấy RSS thô thay vì HTML
async function fetchRssSafe(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 10000
    });
    if (!res.ok) throw new Error(`RSS Error: ${res.status}`);
    return await res.text();
}

async function fetchCoffeeVN() {
    let rawResult = {
        indicator_id: "vn_coffee",
        name: "Cà phê Robusta",
        unit: "VNĐ/kg",
        country: "VN",
        retrieved_at: new Date().toISOString()
    };

    try {
        // TẦNG 1: Dùng RSS của Tin Tây Nguyên (Né Cloudflare HTML)
        const url = 'https://tintaynguyen.com/feed/';
        const xml = await fetchRssSafe(url);
        
        const $ = cheerio.load(xml, { xmlMode: true });
        let priceVal = null;

        // Quét từng bài báo trong RSS
        $('item').each((i, el) => {
            const title = $(el).find('title').text().toLowerCase();
            const desc = $(el).find('description').text();
            
            // Nếu bài báo nói về giá cà phê
            if (title.includes('giá cà phê')) {
                // Bắt con số có 5 hoặc 6 chữ số (VD: 120,500 hoặc 120500)
                const match = desc.match(/([1-9][0-9]{1,2}[.,\s]?[0-9]{3})/);
                if (match) {
                    priceVal = parseInt(match[1].replace(/[^\d]/g, ''));
                    return false; // Dừng vòng lặp
                }
            }
        });

        if (!priceVal) throw new Error("Không bắt được giá cà phê từ RSS");

        return { ...rawResult, value: priceVal, source: { name: "TinTayNguyen (RSS)", url: url, type: "secondary" }, quality: { status: "verified", method: "rss_regex" } };

    } catch (err1) {
        console.warn(`[Agriculture] Lỗi cào RSS Cà phê: ${err1.message}`);
        return { ...rawResult, value: null, source: { name: "Unknown", type: "none" }, quality: { status: "failed", method: "none", error_log: err1.message } };
    }
}

async function fetchPepperVN() {
    let rawResult = {
        indicator_id: "vn_pepper",
        name: "Hồ tiêu",
        unit: "VNĐ/kg",
        country: "VN",
        retrieved_at: new Date().toISOString()
    };

    try {
        // TẦNG 1: Dùng RSS của Tin Tây Nguyên
        const url = 'https://tintaynguyen.com/feed/';
        const xml = await fetchRssSafe(url);
        
        const $ = cheerio.load(xml, { xmlMode: true });
        let priceVal = null;

        $('item').each((i, el) => {
            const title = $(el).find('title').text().toLowerCase();
            const desc = $(el).find('description').text();
            
            // Nếu bài báo nói về giá tiêu
            if (title.includes('giá tiêu')) {
                const match = desc.match(/([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
                if (match) {
                    priceVal = parseInt(match[1].replace(/[^\d]/g, ''));
                    return false;
                }
            }
        });

        if (!priceVal) throw new Error("Không bắt được giá hồ tiêu từ RSS");

        return { ...rawResult, value: priceVal, source: { name: "TinTayNguyen (RSS)", url: url, type: "secondary" }, quality: { status: "verified", method: "rss_regex" } };

    } catch (err1) {
        console.warn(`[Agriculture] Lỗi cào RSS Hồ tiêu: ${err1.message}`);
        return { ...rawResult, value: null, source: { name: "Unknown", type: "none" }, quality: { status: "failed", method: "none", error_log: err1.message } };
    }
}

module.exports = { fetchCoffeeVN, fetchPepperVN };

// FILE: script_bot/modules/market/sources/agriculture.js
const { fetchHtmlSafe, fetchHtmlWithProxy, extractPriceFlexible } = require('../collector/parser_engine');

async function fetchCoffeeVN() {
    let rawResult = {
        indicator_id: "vn_coffee",
        name: "Cà phê Robusta",
        unit: "VNĐ/kg",
        country: "VN",
        retrieved_at: new Date().toISOString()
    };

    const url = 'https://giacaphe.com/gia-ca-phe-noi-dia/';
    const regexPattern = /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/;
    const selectors = ['table tr', '.table-coffee tr'];

    try {
        // TẦNG 1: Lấy trực tiếp (Sẽ bị chặn nếu chạy trên GitHub)
        const html = await fetchHtmlSafe(url, 5000);
        const valStr = extractPriceFlexible(html, selectors, regexPattern);
        const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

        return { ...rawResult, value: priceVal, source: { name: "GiaCaPhe", url: url, type: "primary" }, quality: { status: "verified", method: "html_text" } };
    } catch (err1) {
        console.warn(`[Agriculture] Cà phê: Chặn trực tiếp. Đang thử vượt Cloudflare qua Proxy...`);
        
        // TẦNG 2: Vượt rào bằng Proxy
        try {
            const htmlProxy = await fetchHtmlWithProxy(url);
            const valStr = extractPriceFlexible(htmlProxy, selectors, regexPattern);
            const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

            return { ...rawResult, value: priceVal, source: { name: "GiaCaPhe (Proxy)", url: url, type: "secondary" }, quality: { status: "secondary", method: "html_proxy" } };
        } catch (err2) {
            return { ...rawResult, value: null, source: { name: "Unknown", type: "none" }, quality: { status: "failed", method: "none", error_log: err2.message } };
        }
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

    const url = 'https://giatieu.com/gia-tieu-trong-nuoc/';
    const regexPattern = /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/;
    const selectors = ['table tr', '.table-pepper tr'];

    try {
        // TẦNG 1: Lấy trực tiếp
        const html = await fetchHtmlSafe(url, 5000);
        const valStr = extractPriceFlexible(html, selectors, regexPattern);
        const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

        return { ...rawResult, value: priceVal, source: { name: "GiaTieu", url: url, type: "primary" }, quality: { status: "verified", method: "html_text" } };
    } catch (err1) {
        console.warn(`[Agriculture] Hồ tiêu: Chặn trực tiếp. Đang thử vượt Cloudflare qua Proxy...`);
        
        // TẦNG 2: Vượt rào bằng Proxy
        try {
            const htmlProxy = await fetchHtmlWithProxy(url);
            const valStr = extractPriceFlexible(htmlProxy, selectors, regexPattern);
            const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

            return { ...rawResult, value: priceVal, source: { name: "GiaTieu (Proxy)", url: url, type: "secondary" }, quality: { status: "secondary", method: "html_proxy" } };
        } catch (err2) {
            return { ...rawResult, value: null, source: { name: "Unknown", type: "none" }, quality: { status: "failed", method: "none", error_log: err2.message } };
        }
    }
}

module.exports = { fetchCoffeeVN, fetchPepperVN };

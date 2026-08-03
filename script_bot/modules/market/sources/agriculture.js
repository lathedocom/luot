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

    try {
        // TẦNG 1: Sử dụng Vietnambiz (Ít chặn bot hơn)
        const url = 'https://vietnambiz.vn/gia-ca-phe.htm';
        const html = await fetchHtmlSafe(url, 10000); // Thử cào trực tiếp
        
        // Regex linh hoạt bắt giá (VD: 120.500 hoặc 120,500)
        const valStr = extractPriceFlexible(html, ['.table tbody tr', '.content table tr'], /([1-9][0-9]{1,2}[.,\s]?[0-9]{3})/);
        const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

        return { ...rawResult, value: priceVal, source: { name: "Vietnambiz", url: url, type: "official" }, quality: { status: "verified", method: "html_text" } };

    } catch (err1) {
        console.warn(`[Agriculture] Vietnambiz Cà phê thất bại. Chuyển sang GiaCaPhe qua Proxy...`);
        
        // TẦNG 2: Fallback về GiaCaPhe qua Proxy
        try {
            const url2 = 'https://giacaphe.com/gia-ca-phe-noi-dia/';
            const htmlProxy = await fetchHtmlWithProxy(url2);
            
            const valStr2 = extractPriceFlexible(htmlProxy, ['table tr', '.table-coffee tr'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
            const priceVal2 = parseInt(valStr2.replace(/[^\d]/g, ''));

            return { ...rawResult, value: priceVal2, source: { name: "GiaCaPhe (Proxy)", url: url2, type: "secondary" }, quality: { status: "secondary", method: "html_proxy" } };
        } catch (err2) {
            return { ...rawResult, value: null, source: { name: "Unknown", type: "none" }, quality: { status: "failed", method: "none", error_log: err1.message } };
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

    try {
        // TẦNG 1: Sử dụng Vietnambiz
        const url = 'https://vietnambiz.vn/gia-tieu.htm';
        const html = await fetchHtmlSafe(url, 10000);
        
        const valStr = extractPriceFlexible(html, ['.table tbody tr', '.content table tr'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
        const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

        return { ...rawResult, value: priceVal, source: { name: "Vietnambiz", url: url, type: "official" }, quality: { status: "verified", method: "html_text" } };

    } catch (err1) {
        console.warn(`[Agriculture] Vietnambiz Hồ tiêu thất bại. Chuyển sang GiaTieu qua Proxy...`);
        
        // TẦNG 2: Fallback về GiaTieu qua Proxy
        try {
            const url2 = 'https://giatieu.com/gia-tieu-trong-nuoc/';
            const htmlProxy = await fetchHtmlWithProxy(url2);
            
            const valStr2 = extractPriceFlexible(htmlProxy, ['table tr', '.table-pepper tr'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
            const priceVal2 = parseInt(valStr2.replace(/[^\d]/g, ''));

            return { ...rawResult, value: priceVal2, source: { name: "GiaTieu (Proxy)", url: url2, type: "secondary" }, quality: { status: "secondary", method: "html_proxy" } };
        } catch (err2) {
            return { ...rawResult, value: null, source: { name: "Unknown", type: "none" }, quality: { status: "failed", method: "none", error_log: err1.message } };
        }
    }
}

module.exports = { fetchCoffeeVN, fetchPepperVN };

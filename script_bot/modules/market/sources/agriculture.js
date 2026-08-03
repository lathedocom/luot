// FILE: script_bot/modules/market/sources/agriculture.js
const { fetchHtmlWithProxy, extractPriceFlexible } = require('../collector/parser_engine');

async function fetchCoffeeVN() {
    let rawResult = {
        indicator_id: "vn_coffee",
        name: "Cà phê Robusta",
        unit: "VNĐ/kg",
        country: "VN",
        retrieved_at: new Date().toISOString()
    };

    try {
        // TẦNG 1: Lấy qua Proxy (Bỏ qua fetch trực tiếp vì GitHub 100% bị chặn)
        const url = 'https://giacaphe.com/gia-ca-phe-noi-dia/';
        const htmlProxy = await fetchHtmlWithProxy(url);
        
        const valStr = extractPriceFlexible(htmlProxy, ['table tr', '.table-coffee tr'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
        const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

        return { ...rawResult, value: priceVal, source: { name: "GiaCaPhe (Proxy)", url: url, type: "primary" }, quality: { status: "verified", method: "html_proxy" } };
    } catch (err1) {
        console.warn(`[Agriculture] GiaCaPhe thất bại. Chuyển sang TinTayNguyen...`);
        
        // TẦNG 2: Fallback nguồn TinTayNguyen
        try {
            const url2 = 'https://tintaynguyen.com/gia-ca-phe/';
            const htmlProxy2 = await fetchHtmlWithProxy(url2);
            
            const valStr2 = extractPriceFlexible(htmlProxy2, ['.table-striped tbody tr'], /([1-9][0-9]{1,2}[.,\s]?[0-9]{3})/);
            const priceVal2 = parseInt(valStr2.replace(/[^\d]/g, ''));

            return { ...rawResult, value: priceVal2, source: { name: "TinTayNguyen (Proxy)", url: url2, type: "secondary" }, quality: { status: "secondary", method: "html_proxy" } };
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
        const url = 'https://giatieu.com/gia-tieu-trong-nuoc/';
        const htmlProxy = await fetchHtmlWithProxy(url);
        
        const valStr = extractPriceFlexible(htmlProxy, ['table tr', '.table-pepper tr'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
        const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

        return { ...rawResult, value: priceVal, source: { name: "GiaTieu (Proxy)", url: url, type: "primary" }, quality: { status: "verified", method: "html_proxy" } };
    } catch (err1) {
        console.warn(`[Agriculture] GiaTieu thất bại. Chuyển sang TinTayNguyen...`);
        
        try {
            const url2 = 'https://tintaynguyen.com/gia-tieu/';
            const htmlProxy2 = await fetchHtmlWithProxy(url2);
            
            const valStr2 = extractPriceFlexible(htmlProxy2, ['.table-striped tbody tr'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
            const priceVal2 = parseInt(valStr2.replace(/[^\d]/g, ''));

            return { ...rawResult, value: priceVal2, source: { name: "TinTayNguyen (Proxy)", url: url2, type: "secondary" }, quality: { status: "secondary", method: "html_proxy" } };
        } catch (err2) {
            return { ...rawResult, value: null, source: { name: "Unknown", type: "none" }, quality: { status: "failed", method: "none", error_log: err1.message } };
        }
    }
}

module.exports = { fetchCoffeeVN, fetchPepperVN };

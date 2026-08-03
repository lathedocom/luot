// FILE: script_bot/modules/market/sources/agriculture.js
const { fetchHtmlSafe, extractPriceFlexible } = require('../collector/parser_engine');

async function fetchCoffeeVN() {
    let rawResult = {
        indicator_id: "vn_coffee",
        name: "Cà phê Robusta",
        unit: "VNĐ/kg",
        country: "VN",
        retrieved_at: new Date().toISOString()
    };

    try {
        // TẦNG 1: Thử lấy trang giacaphe.com
        const url = 'https://giacaphe.com/gia-ca-phe-noi-dia/';
        const html = await fetchHtmlSafe(url);
        const valStr = extractPriceFlexible(html, ['table tr', '.table-coffee tr'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
        const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

        return { ...rawResult, value: priceVal, source: { name: "GiaCaPhe", url: url, type: "primary" }, quality: { status: "verified", method: "html_text" } };

    } catch (err1) {
        console.warn(`[Agriculture] GiaCaPhe thất bại/bị chặn. Chuyển sang Tầng 2...`);
        
        // TẦNG 2: Fallback sang chogia.vn
        try {
            const url2 = 'https://chogia.vn/gia-ca-phe/';
            const html2 = await fetchHtmlSafe(url2);
            const valStr2 = extractPriceFlexible(html2, ['table tbody tr'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
            const priceVal2 = parseInt(valStr2.replace(/[^\d]/g, ''));

            return { ...rawResult, value: priceVal2, source: { name: "ChoGia", url: url2, type: "secondary" }, quality: { status: "secondary", method: "html_text" } };
        } catch (err2) {
            console.error(`[Agriculture] Tầng 2 Cà phê cũng thất bại: ${err2.message}`);
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

    try {
        // TẦNG 1: Thử lấy trang giatieu.com
        const url = 'https://giatieu.com/gia-tieu-trong-nuoc/';
        const html = await fetchHtmlSafe(url);
        const valStr = extractPriceFlexible(html, ['table tr', '.table-pepper tr'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
        const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

        return { ...rawResult, value: priceVal, source: { name: "GiaTieu", url: url, type: "primary" }, quality: { status: "verified", method: "html_text" } };

    } catch (err1) {
        console.warn(`[Agriculture] GiaTieu thất bại/bị chặn. Chuyển sang Tầng 2...`);
        
        // TẦNG 2: Fallback sang chogia.vn
        try {
            const url2 = 'https://chogia.vn/gia-tieu/';
            const html2 = await fetchHtmlSafe(url2);
            const valStr2 = extractPriceFlexible(html2, ['table tbody tr'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
            const priceVal2 = parseInt(valStr2.replace(/[^\d]/g, ''));

            return { ...rawResult, value: priceVal2, source: { name: "ChoGia", url: url2, type: "secondary" }, quality: { status: "secondary", method: "html_text" } };
        } catch (err2) {
            console.error(`[Agriculture] Tầng 2 Hồ tiêu cũng thất bại: ${err2.message}`);
            return { ...rawResult, value: null, source: { name: "Unknown", type: "none" }, quality: { status: "failed", method: "none", error_log: err2.message } };
        }
    }
}

module.exports = { fetchCoffeeVN, fetchPepperVN };

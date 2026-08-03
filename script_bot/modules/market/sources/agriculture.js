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
        const url = 'https://giacaphe.com/gia-ca-phe-noi-dia/';
        const html = await fetchHtmlSafe(url);
        
        const valStr = extractPriceFlexible(html, ['table tr', '.table-coffee tr'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
        const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

        return {
            ...rawResult,
            value: priceVal,
            source: { name: "GiaCaPhe", url: url, type: "secondary" },
            quality: { status: "verified", method: "html_text" }
        };

    } catch (error) {
        console.warn(`[Agriculture] Lấy giá Cà phê thất bại: ${error.message}`);
        return {
            ...rawResult,
            value: null,
            source: { name: "Unknown", type: "none" },
            quality: { status: "failed", method: "none", error_log: error.message }
        };
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
        const html = await fetchHtmlSafe(url);
        
        const valStr = extractPriceFlexible(html, ['table tr', '.table-pepper tr'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
        const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

        return {
            ...rawResult,
            value: priceVal,
            source: { name: "GiaTieu", url: url, type: "secondary" },
            quality: { status: "verified", method: "html_text" }
        };

    } catch (error) {
        console.warn(`[Agriculture] Lấy giá Hồ tiêu thất bại: ${error.message}`);
        return {
            ...rawResult,
            value: null,
            source: { name: "Unknown", type: "none" },
            quality: { status: "failed", method: "none", error_log: error.message }
        };
    }
}

module.exports = { fetchCoffeeVN, fetchPepperVN };

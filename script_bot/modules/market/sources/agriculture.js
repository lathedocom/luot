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
        // TẦNG 1: Báo Dân Việt (BẮT BUỘC QUA PROXY ĐỂ TRÁNH LỖI 403)
        const url = 'https://danviet.vn/gia-ca-phe-hom-nay.html';
        const html = await fetchHtmlWithProxy(url);
        
        const valStr = extractPriceFlexible(html, ['.box-content', '.detail-content'], /([1-9][0-9]{1,2}[.,\s]?[0-9]{3})/);
        const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

        return { ...rawResult, value: priceVal, source: { name: "Báo Dân Việt (Proxy)", url: url, type: "secondary" }, quality: { status: "verified", method: "html_proxy" } };

    } catch (err1) {
        console.warn(`[Agriculture] Dân Việt Cà phê thất bại. Chuyển sang Tin Tây Nguyên...`);
        
        // TẦNG 2: Tin Tây Nguyên qua Proxy
        try {
            const url2 = 'https://tintaynguyen.com/gia-ca-phe/';
            const html2 = await fetchHtmlWithProxy(url2);
            const valStr2 = extractPriceFlexible(html2, ['.table-striped tbody tr'], /([1-9][0-9]{1,2}[.,\s]?[0-9]{3})/);
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
        const url = 'https://danviet.vn/gia-tieu-hom-nay.html';
        const html = await fetchHtmlWithProxy(url);
        
        const valStr = extractPriceFlexible(html, ['.box-content', '.detail-content'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
        const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

        return { ...rawResult, value: priceVal, source: { name: "Báo Dân Việt (Proxy)", url: url, type: "secondary" }, quality: { status: "verified", method: "html_proxy" } };

    } catch (err1) {
        console.warn(`[Agriculture] Dân Việt Hồ tiêu thất bại. Chuyển sang Tin Tây Nguyên...`);
        
        try {
            const url2 = 'https://tintaynguyen.com/gia-tieu/';
            const html2 = await fetchHtmlWithProxy(url2);
            const valStr2 = extractPriceFlexible(html2, ['.table-striped tbody tr'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
            const priceVal2 = parseInt(valStr2.replace(/[^\d]/g, ''));

            return { ...rawResult, value: priceVal2, source: { name: "TinTayNguyen (Proxy)", url: url2, type: "secondary" }, quality: { status: "secondary", method: "html_proxy" } };
        } catch (err2) {
            return { ...rawResult, value: null, source: { name: "Unknown", type: "none" }, quality: { status: "failed", method: "none", error_log: err1.message } };
        }
    }
}

module.exports = { fetchCoffeeVN, fetchPepperVN };

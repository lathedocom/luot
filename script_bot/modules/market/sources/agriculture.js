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
        // Sử dụng báo Dân Việt (Thuộc TW Hội Nông dân VN) - Thường xuyên có bài text tổng hợp giá
        const url = 'https://danviet.vn/gia-ca-phe-hom-nay.html';
        const html = await fetchHtmlSafe(url, 10000);
        
        const valStr = extractPriceFlexible(
            html, 
            ['table tbody tr', '.box-content table', '.detail-content'], 
            /([1-9][0-9]{1,2}[.,\s]?[0-9]{3})/ // Bắt số dạng 120.000 hoặc 120,000
        );
        const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

        return { 
            ...rawResult, 
            value: priceVal, 
            source: { name: "Báo Dân Việt", url: url, type: "secondary" }, 
            quality: { status: "verified", method: "html_text" } 
        };

    } catch (err) {
        return { 
            ...rawResult, 
            value: null, 
            source: { name: "Unknown", type: "none" }, 
            quality: { status: "failed", method: "none", error_log: err.message } 
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
        const url = 'https://danviet.vn/gia-tieu-hom-nay.html';
        const html = await fetchHtmlSafe(url, 10000);
        
        const valStr = extractPriceFlexible(
            html, 
            ['table tbody tr', '.box-content table', '.detail-content'], 
            /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/
        );
        const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

        return { 
            ...rawResult, 
            value: priceVal, 
            source: { name: "Báo Dân Việt", url: url, type: "secondary" }, 
            quality: { status: "verified", method: "html_text" } 
        };

    } catch (err) {
        return { 
            ...rawResult, 
            value: null, 
            source: { name: "Unknown", type: "none" }, 
            quality: { status: "failed", method: "none", error_log: err.message } 
        };
    }
}

module.exports = { fetchCoffeeVN, fetchPepperVN };

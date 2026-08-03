// FILE: script_bot/modules/market/sources/fuel.js
const { fetchHtmlSafe, extractPriceFlexible } = require('../collector/parser_engine');

async function fetchFuelData() {
    let rawResult = {
        indicator_id: "vn_ron95",
        name: "Xăng RON95-III",
        unit: "VNĐ/Lít",
        country: "VN",
        retrieved_at: new Date().toISOString()
    };

    try {
        // TẦNG 1: Sử dụng webgia.com (Nguồn đã được chứng thực là an toàn với GitHub Actions)
        const url = 'https://webgia.com/gia-xang-dau/petrolimex/';
        const html = await fetchHtmlSafe(url, 10000);
        
        // Trích xuất giá RON 95-III từ bảng
        const valStr = extractPriceFlexible(
            html, 
            ['table tbody tr', '.price-table tr', 'table tr'], 
            /(?:RON 95-III).*?([1-9][0-9]{0,3}[.,\s]?[0-9]{3})/i
        );
        const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));

        return { 
            ...rawResult, 
            value: priceVal, 
            source: { name: "WebGia (Dữ liệu Petrolimex)", url: url, type: "secondary" }, 
            quality: { status: "verified", method: "html_text" } 
        };

    } catch (err) {
        console.warn(`[Fuel Adapter] Lỗi cào giá xăng: ${err.message}`);
        return { 
            ...rawResult, 
            value: null, 
            source: { name: "Unknown", type: "none" }, 
            quality: { status: "failed", method: "none", error_log: err.message } 
        };
    }
}

module.exports = { fetchFuelData };

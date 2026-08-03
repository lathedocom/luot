// FILE: script_bot/modules/market/sources/gold.js
const { fetchHtmlSafe, extractPriceFlexible } = require('../collector/parser_engine');

async function fetchGoldSJC() {
    let rawResult = {
        indicator_id: "vn_gold_sjc",
        name: "Vàng miếng SJC",
        unit: "Tr/lượng",
        country: "VN",
        retrieved_at: new Date().toISOString()
    };

    try {
        // TẦNG 1: Cào HTML trực tiếp từ trang cập nhật giá
        const url = 'https://webgia.com/gia-vang/sjc/';
        const html = await fetchHtmlSafe(url);
        
        // Thử tìm trong các bảng phổ biến
        const valStr = extractPriceFlexible(
            html, 
            ['table tbody tr', '.price-table tr', 'table tr'], 
            /([1-9][0-9]{0,3}[.,\s]?[0-9]{3})/
        );
        
        // Chuẩn hóa thành đơn vị "Triệu/Lượng" (VD: 82000000 -> 82)
        const rawVal = parseInt(valStr.replace(/[^\d]/g, ''));
        const priceVal = rawVal > 1000000 ? rawVal / 1000000 : rawVal / 1000;

        return {
            ...rawResult,
            value: priceVal,
            source: { name: "WebGia SJC", url: url, type: "secondary" },
            quality: { status: "verified", method: "html_text" }
        };

    } catch (error) {
        console.warn(`[Gold Adapter] Lấy giá SJC thất bại: ${error.message}`);
        // TẦNG 2: Fallback (Có thể là API khác hoặc đánh cờ thất bại)
        return {
            ...rawResult,
            value: null,
            source: { name: "Unknown", type: "none" },
            quality: { status: "failed", method: "none", error_log: error.message }
        };
    }
}

module.exports = { fetchGoldSJC };

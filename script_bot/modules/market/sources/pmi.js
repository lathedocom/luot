// FILE: script_bot/modules/market/sources/pmi.js
const { fetchHtmlWithProxy } = require('../collector/parser_engine');

async function fetchPMI() {
    let rawResult = {
        indicator_id: "vn_pmi",
        name: "Chỉ số PMI",
        unit: "Điểm",
        country: "VN",
        frequency: "monthly",
        retrieved_at: new Date().toISOString()
    };

    try {
        // Sử dụng Trading Economics (Dữ liệu vĩ mô đáng tin cậy nhất)
        const url = 'https://vi.tradingeconomics.com/vietnam/manufacturing-pmi';
        const html = await fetchHtmlWithProxy(url);
        
        // Regex bắt số điểm PMI (thường nằm quanh khoảng 40.0 đến 60.0)
        // Tìm trong thẻ chứa giá trị gần nhất
        const match = html.match(/Lần Cuối[\s\S]*?([4-6][0-9][.,][0-9])/i) || html.match(/PMI.*?([4-6][0-9][.,][0-9])/i);
        
        if (!match) throw new Error("Không bắt được điểm số PMI qua Regex");
        const pmiValue = parseFloat(match[1].replace(',', '.'));

        return {
            ...rawResult,
            value: pmiValue,
            period: new Date().toISOString().substring(0, 7), // YYYY-MM
            source: { name: "Trading Economics (Proxy)", url: url, type: "aggregate" },
            quality: { status: "verified", method: "html_proxy" }
        };

    } catch (error) {
        console.warn(`[PMI Adapter] Lấy PMI thất bại: ${error.message}`);
        return {
            ...rawResult,
            value: null,
            source: { name: "Unknown", type: "none" },
            quality: { status: "failed", method: "none", error_log: error.message }
        };
    }
}

module.exports = { fetchPMI };

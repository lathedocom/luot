// FILE: script_bot/modules/market/sources/pmi.js
const { fetchHtmlSafe, extractPriceFlexible } = require('../collector/parser_engine');

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
        // TẦNG 1: Cào từ trang tin uy tín hoặc S&P Global Report
        // Vì PMI thường nằm trong bài báo dạng text, ta dùng regex linh hoạt
        const url = 'https://cafef.vn/pmi-viet-nam.html'; // Giả lập URL tag
        const html = await fetchHtmlSafe(url);
        
        // Cố gắng bắt đoạn text: "Chỉ số PMI đạt 51.5 điểm" hoặc "PMI ... 51,5"
        const valStr = extractPriceFlexible(html, ['.timeline-content', '.news-desc'], /(?:PMI).*?([4-6][0-9][.,][0-9])/i);
        const pmiValue = parseFloat(valStr.replace(',', '.'));

        return {
            ...rawResult,
            value: pmiValue,
            period: new Date().toISOString().substring(0, 7), // YYYY-MM
            source: { name: "S&P Global / Báo chí", url: url, type: "aggregate" },
            quality: { status: "verified", method: "html_text" }
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

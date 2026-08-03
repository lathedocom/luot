// FILE: script_bot/modules/market/sources/stocks.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { fetchJsonWithProxy } = require('../collector/parser_engine');

async function fetchVNIndex() {
    let rawResult = {
        indicator_id: "vn_index",
        name: "VN-Index",
        unit: "Điểm",
        country: "VN",
        retrieved_at: new Date().toISOString()
    };

    try {
        // TẦNG 1: Sử dụng TCBS API (Rất ổn định, không chặn IP quốc tế)
        const url = `https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/bars-long/VNINDEX?type=index&resolution=D&size=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        
        if (!res.ok) throw new Error(`TCBS API Error: ${res.status}`);
        
        const json = await res.json();
        if (!json.data || json.data.length === 0) throw new Error("TCBS trả về rỗng");
        
        const price = json.data[0].close;

        return {
            ...rawResult,
            value: price,
            source: { name: "TCBS", url: url, type: "official" },
            quality: { status: "verified", method: "api" }
        };

    } catch (errorTier1) {
        console.warn(`[Stock Adapter] TCBS thất bại. Chuyển sang Yahoo qua Proxy...`);
        
        try {
            // TẦNG 2: Sử dụng Yahoo Finance qua Proxy dự phòng
            const url2 = `https://query1.finance.yahoo.com/v8/finance/chart/^VNINDEX?range=1d&interval=1d`;
            const json = await fetchJsonWithProxy(url2);
            const price = json.chart.result[0].meta.regularMarketPrice;

            return {
                ...rawResult,
                value: price,
                source: { name: "Yahoo Finance", url: url2, type: "secondary" },
                quality: { status: "secondary", method: "api_proxy" }
            };
        } catch (errorTier2) {
            return {
                ...rawResult,
                value: null,
                source: { name: "Unknown", type: "none" },
                quality: { status: "failed", method: "none", error_log: errorTier2.message }
            };
        }
    }
}

module.exports = { fetchVNIndex };

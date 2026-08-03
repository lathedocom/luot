// FILE: script_bot/modules/market/sources/stocks.js
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
        // TẦNG 1: Sử dụng Yahoo Finance
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/^VNINDEX?range=1d&interval=1d`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        
        if (!res.ok) throw new Error(`Yahoo API Error: ${res.status}`);
        
        const data = await res.json();
        const price = data.chart.result[0].meta.regularMarketPrice;

        return {
            ...rawResult,
            value: price,
            source: { name: "Yahoo Finance", url: url, type: "official" },
            quality: { status: "verified", method: "api" }
        };

    } catch (errorTier1) {
        console.warn(`[Stock Adapter] Yahoo thất bại. Chuyển sang VNDirect qua Proxy...`);
        
        // TẦNG 2: Sử dụng API của VNDirect nhưng bọc qua Proxy để trị lỗi SSL
        try {
            const url2 = `https://finfo-api.vndirect.com.vn/v4/stock_indexes?q=code:VNINDEX`;
            
            // Gọi Proxy thay vì gọi trực tiếp
            const json = await fetchJsonWithProxy(url2);
            
            const indexData = (json.data || []).find(d => d.code === 'VNINDEX');
            if (!indexData) throw new Error("Không tìm thấy VNINDEX");

            return {
                ...rawResult,
                value: indexData.indexValue,
                source: { name: "VNDirect (Proxy)", url: url2, type: "secondary" },
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

// FILE: script_bot/modules/market/sources/stocks.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function fetchVNIndex() {
    let rawResult = {
        indicator_id: "vn_index",
        name: "VN-Index",
        unit: "Điểm",
        country: "VN",
        retrieved_at: new Date().toISOString()
    };

    try {
        // TẦNG 1: Sử dụng Yahoo Finance (Cực kỳ ổn định trên GitHub Actions)
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
        console.warn(`[Stock Adapter] Yahoo thất bại. Chuyển sang VNDirect...`);
        
        // TẦNG 2: Sử dụng API của VNDirect (Dự phòng)
        try {
            const url2 = `https://finfo-api.vndirect.com.vn/v4/stock_indexes?q=code:VNINDEX`;
            const res2 = await fetch(url2, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            
            if (!res2.ok) throw new Error(`VNDirect API Error: ${res2.status}`);
            
            const json = await res2.json();
            const indexData = (json.data || []).find(d => d.code === 'VNINDEX');
            if (!indexData) throw new Error("Không tìm thấy VNINDEX");

            return {
                ...rawResult,
                value: indexData.indexValue,
                source: { name: "VNDirect", url: url2, type: "secondary" },
                quality: { status: "secondary", method: "api" }
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

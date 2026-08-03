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
        // TẦNG 1: TCBS API - Không chặn IP quốc tế, SSL cực kỳ ổn định
        const url = `https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/bars-long/VNINDEX?type=index&resolution=D&size=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
        
        if (!res.ok) throw new Error(`TCBS API Error: ${res.status}`);
        const json = await res.json();
        
        return {
            ...rawResult,
            value: json.data[0].close,
            source: { name: "TCBS", url: url, type: "official" },
            quality: { status: "verified", method: "api_direct" }
        };

    } catch (errorTier1) {
        console.warn(`[Stock Adapter] TCBS thất bại. Chuyển sang SSI FastConnect...`);
        
        try {
            // TẦNG 2: SSI iBoard API (Websocket REST backend)
            const toDate = Math.floor(Date.now() / 1000);
            const fromDate = toDate - 86400; // Lấy 1 ngày
            const url2 = `https://iboard.ssi.com.vn/dchart/api/history?resolution=D&symbol=VNINDEX&from=${fromDate}&to=${toDate}`;
            
            const res2 = await fetch(url2, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
            if (!res2.ok) throw new Error(`SSI API Error: ${res2.status}`);
            
            const json2 = await res2.json();
            const price = json2.c[json2.c.length - 1]; // Mảng 'c' là Close price

            return {
                ...rawResult,
                value: price,
                source: { name: "SSI", url: url2, type: "secondary" },
                quality: { status: "secondary", method: "api_direct" }
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

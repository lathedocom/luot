// FILE: script_bot/modules/market/sources/energy.js

async function fetchBrentOil() {
    let rawResult = {
        indicator_id: "global_brent",
        name: "Dầu Brent",
        unit: "USD/thùng",
        country: "Global",
        retrieved_at: new Date().toISOString()
    };

    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?range=1d&interval=1d`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        
        if (!res.ok) throw new Error("Yahoo API trả về lỗi");
        const data = await res.json();
        
        const price = data.chart.result[0].meta.regularMarketPrice;

        return {
            ...rawResult,
            value: price,
            source: { name: "Yahoo Finance", url: url, type: "official" },
            quality: { status: "verified", method: "api" }
        };

    } catch (error) {
        console.warn(`[Energy Adapter] Lỗi giá Dầu: ${error.message}`);
        return {
            ...rawResult,
            value: null,
            source: { name: "Unknown", type: "none" },
            quality: { status: "failed", method: "none", error_log: error.message }
        };
    }
}

module.exports = { fetchBrentOil };

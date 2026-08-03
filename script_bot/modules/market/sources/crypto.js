// FILE: script_bot/modules/market/sources/crypto.js

async function fetchBitcoin() {
    let rawResult = {
        indicator_id: "global_btc",
        name: "Bitcoin",
        unit: "USD",
        country: "Global",
        retrieved_at: new Date().toISOString()
    };

    try {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        
        if (!res.ok) throw new Error(`CoinGecko API Error: ${res.status}`);
        
        const data = await res.json();
        if (!data.bitcoin || !data.bitcoin.usd) throw new Error("Sai cấu trúc JSON CoinGecko");

        return {
            ...rawResult,
            value: data.bitcoin.usd,
            source: { name: "CoinGecko", url: url, type: "official" },
            quality: { status: "verified", method: "api" }
        };

    } catch (error) {
        console.warn(`[Crypto Adapter] Lỗi lấy giá BTC: ${error.message}`);
        return {
            ...rawResult,
            value: null,
            source: { name: "Unknown", type: "none" },
            quality: { status: "failed", method: "none", error_log: error.message }
        };
    }
}

module.exports = { fetchBitcoin };

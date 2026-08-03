// FILE: script_bot/modules/market/sources/pmi.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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
        // TẦNG 1: Sử dụng API Vĩ mô của VNDirect
        const url = `https://finfo-api.vndirect.com.vn/v4/macro_observations?q=itemCode:PMI&sort=-date&size=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
        
        if (!res.ok) throw new Error(`VNDirect API Error: ${res.status}`);
        
        const json = await res.json();
        if (!json.data || json.data.length === 0) throw new Error("Dữ liệu PMI trả về rỗng");

        const latestData = json.data[0];

        return {
            ...rawResult,
            value: latestData.value,
            period: latestData.date, 
            source: { name: "S&P Global / VNDirect", url: url, type: "official" },
            quality: { status: "verified", method: "api_direct" }
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

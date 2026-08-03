// FILE: script_bot/modules/market/sources/stocks.js
// Bỏ qua lỗi chứng chỉ SSL (Rất phổ biến với các API nội địa VN)
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
        // TẦNG 1: Sử dụng API của VNDirect
        const url = `https://finfo-api.vndirect.com.vn/v4/stock_indexes?q=code:VNINDEX`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        
        if (!res.ok) throw new Error(`VNDirect API Error: ${res.status}`);
        
        const json = await res.json();
        const dataList = json.data || [];
        const indexData = dataList.find(d => d.code === 'VNINDEX');
        
        if (!indexData) throw new Error("Không tìm thấy VNINDEX trong JSON trả về");

        return {
            ...rawResult,
            value: indexData.indexValue,
            source: { name: "HOSE / VNDirect", url: url, type: "official" },
            quality: { status: "verified", method: "api" }
        };

    } catch (error) {
        console.warn(`[Stock Adapter] Lỗi API Chứng khoán: ${error.message}`);
        return {
            ...rawResult,
            value: null,
            source: { name: "Unknown", type: "none" },
            quality: { status: "failed", method: "none", error_log: error.message }
        };
    }
}

module.exports = { fetchVNIndex };

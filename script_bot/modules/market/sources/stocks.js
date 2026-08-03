// FILE: script_bot/modules/market/sources/stocks.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { fetchHtmlWithProxy, extractPriceFlexible } = require('../collector/parser_engine');

async function fetchVNIndex() {
    let rawResult = {
        indicator_id: "vn_index",
        name: "VN-Index",
        unit: "Điểm",
        country: "VN",
        retrieved_at: new Date().toISOString()
    };

    try {
        // TẦNG 1: Sử dụng API của VPS (Cực kỳ mở, hiếm khi chặn bot)
        const url = `https://bgapidatafeed.vps.com.vn/getlistindexdetail/VNINDEX`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
        
        if (!res.ok) throw new Error(`VPS API Error: ${res.status}`);
        
        const json = await res.json();
        if (!json || json.length === 0 || !json[0].matchPrice) throw new Error("Dữ liệu VPS rỗng");

        return {
            ...rawResult,
            value: json[0].matchPrice,
            source: { name: "VPS", url: url, type: "official" },
            quality: { status: "verified", method: "api_direct" }
        };

    } catch (errorTier1) {
        console.warn(`[Stock Adapter] VPS thất bại. Chuyển sang CafeF qua Proxy...`);
        
        try {
            // TẦNG 2: Fallback cào HTML trang chủ CafeF qua Proxy tàng hình
            const url2 = 'https://s.cafef.vn/Trang-chu.chn';
            const htmlProxy = await fetchHtmlWithProxy(url2);
            
            // Tìm số điểm VN-Index trên giao diện CafeF
            const valStr = extractPriceFlexible(htmlProxy, ['.vnindex .point', '#vnindex .index'], /([1-2][0-9]{3}[.,][0-9]{1,2})/);
            const price = parseFloat(valStr.replace(',', '.'));

            return {
                ...rawResult,
                value: price,
                source: { name: "CafeF (Proxy)", url: url2, type: "secondary" },
                quality: { status: "secondary", method: "html_proxy" }
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

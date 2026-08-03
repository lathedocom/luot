// FILE: script_bot/modules/market/sources/pmi.js
const { fetchJsonDirect, fetchHtmlWithProxy } = require('../collector/parser_engine');

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
        // TẦNG 1: Gọi trực tiếp API VNDirect
        const url = `https://finfo-api.vndirect.com.vn/v4/macro_observations?q=itemCode:PMI&sort=-date&size=1`;
        const json = await fetchJsonDirect(url);
        
        if (!json.data || json.data.length === 0) throw new Error("Dữ liệu PMI VNDirect rỗng");

        return {
            ...rawResult,
            value: json.data[0].value,
            period: json.data[0].date, 
            source: { name: "VNDirect", url: url, type: "api" },
            quality: { status: "verified", method: "api_direct" }
        };

    } catch (errorTier1) {
        console.warn(`[PMI Adapter] VNDirect API thất bại (${errorTier1.message}). Chuyển sang Trading Economics...`);
        
        try {
            // TẦNG 2: Trading Economics (Trang HTML, buộc phải qua Proxy)
            const url2 = 'https://vi.tradingeconomics.com/vietnam/manufacturing-pmi';
            const htmlProxy = await fetchHtmlWithProxy(url2, 15000);
            
            const match = htmlProxy.match(/Lần Cuối[\s\S]*?([4-6][0-9][.,][0-9]{1,2})/i) || htmlProxy.match(/PMI.*?([4-6][0-9][.,][0-9]{1,2})/i);
            if (!match) throw new Error("Không bắt được điểm số PMI từ HTML");
            
            const pmiValue = parseFloat(match[1].replace(',', '.'));

            return {
                ...rawResult,
                value: pmiValue,
                period: new Date().toISOString().substring(0, 7), 
                source: { name: "Trading Economics", url: url2, type: "secondary" },
                quality: { status: "secondary", method: "html_proxy" }
            };
        } catch (errorTier2) {
            return {
                ...rawResult,
                value: null,
                source: { name: "Unknown", type: "none" },
                quality: { status: "failed", method: "none", error_log: errorTier1.message }
            };
        }
    }
}

module.exports = { fetchPMI };

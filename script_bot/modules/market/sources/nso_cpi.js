// FILE: script_bot/modules/market/sources/nso_cpi.js
const { fetchJsonWithProxy, fetchHtmlWithProxy } = require('../collector/parser_engine');

async function fetchCPI() {
    let rawResult = {
        indicator_id: "vn_cpi",
        name: "Lạm phát (CPI)",
        unit: "%",
        country: "VN",
        frequency: "monthly",
        retrieved_at: new Date().toISOString()
    };

    try {
        // TẦNG 1: VNDirect API bọc qua Proxy 
        // Vượt rào IP GitHub Actions và tự động xử lý Timeout bằng AbortController bên trong parser_engine
        const url = `https://finfo-api.vndirect.com.vn/v4/macro_observations?q=itemCode:CPI_YOY&sort=-date&size=1`;
        const json = await fetchJsonWithProxy(url, 15000);
        
        if (!json.data || json.data.length === 0) throw new Error("Dữ liệu CPI VNDirect rỗng");

        const latestData = json.data[0];

        return {
            ...rawResult,
            value: latestData.value,
            period: latestData.date, 
            source: { name: "Tổng cục Thống kê (VNDirect API)", url: url, type: "official" },
            quality: { status: "verified", method: "api_proxy" }
        };

    } catch (errorTier1) {
        console.warn(`[CPI Adapter] VNDirect API thất bại. Chuyển sang Trading Economics...`);
        
        try {
            // TẦNG 2: Trading Economics (Nguồn Vĩ mô Quốc tế) bọc qua Proxy
            const url2 = 'https://vi.tradingeconomics.com/vietnam/inflation-cpi';
            const htmlProxy = await fetchHtmlWithProxy(url2, 15000);
            
            // Regex bắt điểm CPI (Lạm phát thường dao động từ 1.0 đến 10.0 ở VN)
            const match = htmlProxy.match(/Lần Cuối[\s\S]*?([0-9][.,][0-9]{1,2})/i) || htmlProxy.match(/Lạm phát.*?([0-9][.,][0-9]{1,2})/i);
            
            if (!match) throw new Error("Không bắt được điểm số CPI từ HTML Trading Economics");
            
            const cpiValue = parseFloat(match[1].replace(',', '.'));

            return {
                ...rawResult,
                value: cpiValue,
                period: new Date().toISOString().substring(0, 7), 
                source: { name: "Trading Economics (Proxy)", url: url2, type: "secondary" },
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

module.exports = { fetchCPI };

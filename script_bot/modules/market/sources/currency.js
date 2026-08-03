// FILE: script_bot/modules/market/sources/currency.js
const cheerio = require('cheerio');

async function fetchUSDVND() {
    let rawResult = {
        country: "VN",
        retrieved_at: new Date().toISOString()
    };

    try {
        // TẦNG 1: Sử dụng Yahoo Finance API (Primary)
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/VND=X?range=1d&interval=1d`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
        
        if (!res.ok) throw new Error("Yahoo API trả về lỗi");
        const data = await res.json();
        
        const price = data.chart.result[0].meta.regularMarketPrice;
        
        return {
            ...rawResult,
            value: price,
            source: { name: "Yahoo Finance", url: url, type: "official" },
            quality: { status: "verified", method: "api" }
        };

    } catch (errorTier1) {
        console.warn("[Currency Adapter] Yahoo Finance thất bại. Kích hoạt Fallback Vietcombank...");

        try {
            // TẦNG 2: Fallback cào HTML từ Vietcombank
            const url = 'https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx';
            const res = await fetch(url);
            const xml = await res.text();
            
            const $ = cheerio.load(xml, { xmlMode: true });
            const usdNode = $('Exrate[CurrencyCode="USD"]');
            
            if (usdNode.length > 0) {
                const sellPrice = usdNode.attr('Sell'); // Ưu tiên giá bán
                return {
                    ...rawResult,
                    value: sellPrice,
                    source: { name: "Vietcombank", url: url, type: "secondary" },
                    quality: { status: "secondary", method: "xml_parser" }
                };
            }
            throw new Error("Không tìm thấy node USD trong XML");

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

module.exports = { fetchUSDVND };

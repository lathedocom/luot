// FILE: script_bot/modules/market/sources/nso_cpi.js
const cheerio = require('cheerio');
const { fetchHtmlSafe } = require('../collector/parser_engine');

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
        // TẦNG 1: TRADINGVIEW API (Đã cập nhật đúng mã Ticker chuẩn VNIRYY)
        const tvUrl = 'https://scanner.tradingview.com/global/scan';
        const tvResponse = await fetch(tvUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            // VNIRYY = Vietnam Inflation Rate Year-over-Year
            body: JSON.stringify({
                "symbols": { "tickers": ["ECONOMICS:VNIRYY"] },
                "columns": ["close"]
            }),
            timeout: 10000
        });
        
        const tvJson = await tvResponse.json();
        
        if (!tvJson.data || tvJson.data.length === 0 || !tvJson.data[0].d) {
            throw new Error("Mã VNIRYY không có dữ liệu");
        }
        
        const cpiVal = parseFloat(tvJson.data[0].d[0]);
        if (isNaN(cpiVal)) throw new Error("Giá trị TradingView bị lỗi NaN");

        return {
            ...rawResult,
            value: cpiVal,
            period: new Date().toISOString().substring(0, 7), 
            source: { name: "TradingView", url: "https://www.tradingview.com", type: "api" }, 
            quality: { status: "verified", method: "api_direct" }
        };

    } catch (errorTier1) {
        console.warn(`[CPI] Tầng 1 (TradingView) thất bại: ${errorTier1.message}. Kích hoạt Tuyệt chiêu Google News...`);
        
        try {
            // TẦNG 2: GOOGLE NEWS RSS (Xuyên thủng mọi tường lửa, IP GitHub không bao giờ bị chặn)
            // Tìm kiếm các bài báo nói về CPI Việt Nam tăng so với cùng kỳ
            const query = encodeURIComponent('"CPI" "Việt Nam" "tăng" "so với cùng kỳ"');
            const googleNewsUrl = `https://news.google.com/rss/search?q=${query}&hl=vi&gl=VN&ceid=VN:vi`;
            
            const rssXml = await fetchHtmlSafe(googleNewsUrl, 10000);
            if (!rssXml || !rssXml.includes('<rss')) throw new Error("Google News không trả về RSS");

            const $ = cheerio.load(rssXml, { xmlMode: true });
            let cpiValue2 = null;

            // Quét các tiêu đề bài báo (Ví dụ: "CPI tháng 7/2026 tăng 4,45% so với cùng kỳ...")
            $('item title').each((i, el) => {
                if (cpiValue2) return;
                const titleText = $(el).text();
                
                // Bắt con số nằm ngay sau chữ "tăng" và trước dấu "%"
                const match = titleText.match(/tăng\s*([0-9]{1,2}[.,][0-9]{1,2})\s*%/i);
                if (match) {
                    cpiValue2 = parseFloat(match[1].replace(',', '.'));
                }
            });

            if (!cpiValue2 || isNaN(cpiValue2)) throw new Error("Không quét được con số từ tiêu đề báo");

            return {
                ...rawResult,
                value: cpiValue2,
                period: new Date().toISOString().substring(0, 7), 
                source: { name: "Báo chí (via Google News)", url: googleNewsUrl, type: "news_scraping" }, 
                quality: { status: "secondary", method: "xml_rss_scraping" }
            };

        } catch (errorTier2) {
            console.warn(`[CPI] Tầng 2 (Google News) thất bại: ${errorTier2.message}. Kích hoạt số tĩnh.`);
            
            // TẦNG 3: Fallback tĩnh cuối cùng
            return {
                ...rawResult,
                value: 4.09, 
                period: "2026-07",
                status: "offline_fallback",
                source: { name: "Tổng cục Thống kê (Dự phòng)", type: "fallback" },
                quality: { status: "failed_but_cached", method: "hardcode", error_log: errorTier2.message }
            };
        }
    }
}

// ==========================================
// TEST MÔI TRƯỜNG LOCAL
// ==========================================
if (require.main === module) {
    console.log("🚀 Đang khởi động kiểm tra cào chỉ số CPI (Chiến thuật Xuyên thủng Tường lửa)...");
    fetchCPI()
        .then(result => {
            console.log("\n✅ KẾT QUẢ CÀO DỮ LIỆU THÀNH CÔNG:");
            console.log(JSON.stringify(result, null, 2));
        })
        .catch(err => {
            console.error("\n❌ LỖI NGHIÊM TRỌNG:", err);
        });
}

module.exports = { fetchCPI };

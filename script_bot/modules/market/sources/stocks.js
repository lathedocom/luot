// FILE: script_bot/modules/market/sources/stocks.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const cheerio = require('cheerio');
const { fetchHtmlSafe } = require('../collector/parser_engine');

// Bộ giải mã số học thông minh (Chuyên trị các kiểu viết 1.250 | 1250,5 | 1,250.50)
function parseVnIndexNumber(str) {
    let clean = str.replace(/[^\d.,]/g, '');
    
    // Nếu có cả phẩy và chấm (VD: 1,250.50 hoặc 1.250,50)
    if (clean.includes('.') && clean.includes(',')) {
        let lastComma = clean.lastIndexOf(',');
        let lastDot = clean.lastIndexOf('.');
        let decSep = lastComma > lastDot ? ',' : '.';
        let parts = clean.split(decSep);
        let intPart = parts[0].replace(/[.,]/g, '');
        return parseFloat(intPart + '.' + parts[1]);
    }
    
    // Nếu chỉ có 1 loại dấu phân cách
    let match = clean.match(/([.,])(\d+)$/);
    if (match) {
        let sep = match[1];
        let tail = match[2];
        // Nếu phần đuôi có đúng 3 chữ số (VD: 1.250) -> Nó là dấu phân cách hàng nghìn
        if (tail.length === 3) {
            return parseFloat(clean.replace(/[.,]/g, ''));
        } else {
            // Nếu đuôi có 1 hoặc 2 chữ số (VD: 1250.5) -> Nó là dấu thập phân
            return parseFloat(clean.replace(sep, '.'));
        }
    }
    
    return parseFloat(clean);
}

async function fetchVNIndex() {
    let rawResult = {
        indicator_id: "vn_index",
        name: "VN-Index",
        unit: "Điểm",
        country: "VN",
        retrieved_at: new Date().toISOString()
    };

    try {
        // TẦNG 1: TRADINGVIEW API (Đã thêm tiền tố HOSE:VNINDEX)
        const tvUrl = 'https://scanner.tradingview.com/global/scan';
        const tvResponse = await fetch(tvUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({
                "symbols": { "tickers": ["HOSE:VNINDEX"] },
                "columns": ["close"]
            }),
            timeout: 10000
        });
        
        const tvJson = await tvResponse.json();
        if (!tvJson.data || tvJson.data.length === 0 || !tvJson.data[0].d) {
            throw new Error("Mã HOSE:VNINDEX rỗng trên TradingView");
        }
        
        const vnIndexVal = parseFloat(tvJson.data[0].d[0]);
        if (isNaN(vnIndexVal)) throw new Error("TradingView trả về lỗi NaN");

        return {
            ...rawResult,
            value: vnIndexVal,
            source: { name: "TradingView", url: "https://www.tradingview.com", type: "api" },
            quality: { status: "verified", method: "api_direct" }
        };

    } catch (err1) {
        console.warn(`[Stock] Tầng 1 (TradingView) thất bại: ${err1.message}. Chuyển sang VPS API...`);
        
        try {
            // TẦNG 2: VPS API (Đã thêm lớp bảo vệ chống văng khi cuối tuần API trả về null)
            const vpsUrl = `https://bgapidatafeed.vps.com.vn/getlistindexdetail/VNINDEX`;
            const resVps = await fetch(vpsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
            const jsonVps = await resVps.json();
            
            // Xử lý an toàn: Kiểm tra mảng có tồn tại và có phần tử đầu tiên không
            if (!jsonVps || !Array.isArray(jsonVps) || !jsonVps[0] || !jsonVps[0].matchPrice) {
                throw new Error("VPS bảo trì hoặc trả về rỗng (Cuối tuần)");
            }

            return {
                ...rawResult,
                value: parseFloat(jsonVps[0].matchPrice),
                source: { name: "VPS", url: vpsUrl, type: "official" },
                quality: { status: "secondary", method: "api_direct" }
            };
        } catch (err2) {
            console.warn(`[Stock] Tầng 2 (VPS) thất bại: ${err2.message}. Kích hoạt Google News...`);
            
            try {
                // TẦNG 3: GOOGLE NEWS RSS (Đã nâng cấp Regex và Parser)
                const query = encodeURIComponent('"VN-Index" "điểm"');
                const gnUrl = `https://news.google.com/rss/search?q=${query}&hl=vi&gl=VN&ceid=VN:vi`;
                
                const xml = await fetchHtmlSafe(gnUrl, 10000);
                if (!xml || !xml.includes('<rss')) throw new Error("Không lấy được RSS");

                const $ = cheerio.load(xml, { xmlMode: true });
                let newsItems = [];
                
                $('item').each((i, el) => {
                    const title = $(el).find('title').text();
                    const desc = $(el).find('description').text();
                    const pubDate = new Date($(el).find('pubDate').text()).getTime();
                    if ((title || desc) && !isNaN(pubDate)) {
                        newsItems.push({ title, desc, pubDate });
                    }
                });
                
                newsItems.sort((a, b) => b.pubDate - a.pubDate);
                let finalPrice = null;
                
                for (const item of newsItems) {
                    const fullText = (item.title + " " + item.desc).toLowerCase();
                    
                    // Nới lỏng Regex để bắt được cả "1.250" hay "1250,5"
                    const match = fullText.match(/(?:vn[- ]?index)[\s\S]{0,60}?(1[0-5][0-9]{2}(?:[.,][0-9]{1,3})?)\s*(?:điểm)?/i) 
                               || fullText.match(/(1[0-5][0-9]{2}(?:[.,][0-9]{1,3})?)\s*(?:điểm)/i);
                    
                    if (match) {
                        const val = parseVnIndexNumber(match[1]);
                        // VN-Index chắc chắn dao động từ 1000 đến 1600
                        if (val >= 1000 && val <= 1600) {
                            finalPrice = val;
                            break;
                        }
                    }
                }
                
                if (!finalPrice) throw new Error("Không bắt được điểm số hợp lệ từ báo chí");
                
                return {
                    ...rawResult,
                    value: finalPrice,
                    source: { name: "Báo chí (Google News)", url: gnUrl, type: "news_scraping" },
                    quality: { status: "tertiary", method: "google_spider" }
                };
            } catch (err3) {
                console.warn(`[Stock] Tầng 3 (Google News) thất bại: ${err3.message}. Kích hoạt số tĩnh.`);
                
                // TẦNG 4: Fallback tĩnh
                return {
                    ...rawResult,
                    value: 1250.50,
                    status: "offline_fallback",
                    source: { name: "Giá tham chiếu", type: "fallback" },
                    quality: { status: "failed_but_cached", method: "hardcode", error_log: err3.message }
                };
            }
        }
    }
}

// ==========================================
// TEST MÔI TRƯỜNG LOCAL
// ==========================================
if (require.main === module) {
    console.log("🚀 Đang khởi động kiểm tra cào Chỉ số Chứng khoán (Hoàn thiện Cuối tuần)...");
    
    fetchVNIndex()
        .then(result => {
            console.log("\n✅ [VN-INDEX] KẾT QUẢ CÀO DỮ LIỆU:");
            console.log(JSON.stringify(result, null, 2));
        })
        .catch(err => {
            console.error("\n❌ LỖI NGHIÊM TRỌNG:", err);
        });
}

module.exports = { fetchVNIndex };

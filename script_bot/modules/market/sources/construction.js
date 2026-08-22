// FILE: script_bot/modules/market/sources/construction.js
const cheerio = require('cheerio');
const { fetchHtmlSafe } = require('../collector/parser_engine');

// Hàm trích xuất thông minh từ Google News với quy luật Khóa Thương hiệu & Dải giá sát thực tế
async function extractFromGoogleNews(keyword, type) {
    const encodedQuery = encodeURIComponent(keyword);
    const gnUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=vi&gl=VN&ceid=VN:vi`;
    
    const xml = await fetchHtmlSafe(gnUrl, 10000);
    if (!xml || !xml.includes('<rss')) return null;

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
    
    for (const item of newsItems) {
        const fullText = (item.title + " " + item.desc).toLowerCase();
        
        if (type === 'steel') {
            // Ưu tiên Thép Hòa Phát, bắt dải giá (VD: 14.210 - 14.500 đồng/kg)
            let match = fullText.match(/hòa phát[\s\S]{0,80}?(1[3-6][.,\s]?[0-9]{3})\s*(?:đồng|đ|vnd|vnđ)/i);
            
            // Fallback: Tìm giá thép chung chung có chữ /kg
            if (!match) {
                match = fullText.match(/(1[3-6][.,\s]?[0-9]{3})\s*(?:đồng|đ|vnd|vnđ)\s*\/?\s*kg/i);
            }

            if (match) {
                let numInt = parseInt(match[1].replace(/[^\d]/g, ''));
                if (numInt >= 13000 && numInt <= 16000) {
                    return { val: parseFloat((numInt / 1000).toFixed(2)), url: gnUrl };
                }
            }
        }
        
        if (type === 'cement') {
            // Ưu tiên 1: Bắt các hãng lớn (Bổ sung thêm INSEE, Long Sơn)
            // Lọc các số có đầu 5, 6, 7, 8, 9, 10, 11, 12 để bao phủ từ 55.000 đến 125.000
            let match = fullText.match(/(?:insee|holcim|scg|chinfon|hà tiên|hoàng thạch|bỉm sơn|nghi sơn|long sơn|cẩm phả)[\s\S]{0,80}?([5-9][0-9]|1[0-2][0-9])[.,\s]?(?:000|k|nghìn)\s*(?:đồng|đ|vnd|vnđ)/i);
            
            // Ưu tiên 2: Cấu trúc dải giá chuẩn 75.000 - 90.000 đồng/bao
            // Bắt buộc phải có chữ "/bao" để chống bắt nhầm tiền phí, tiền giảm giá
            if (!match) {
                match = fullText.match(/([5-9][0-9]|1[0-2][0-9])[.,\s]?(?:000|k|nghìn)(?:\s*(?:-|–|đến|~)\s*(?:[5-9][0-9]|1[0-2][0-9])[.,\s]?(?:000|k|nghìn))?\s*(?:đồng|đ|vnd|vnđ)\s*\/?\s*bao/i);
            }
            
            // Ưu tiên 3: Có chữ "xi măng" đứng gần giá tiền
            if (!match) {
                match = fullText.match(/xi măng[\s\S]{0,50}?([5-9][0-9]|1[0-2][0-9])[.,\s]?(?:000|k|nghìn)\s*(?:đồng|đ|vnd|vnđ)/i);
            }

            if (match) {
                let numInt = parseInt(match[1].replace(/[^\d]/g, ''));
                // SIẾT CHẶT BIÊN ĐỘ: Giá xi măng tối thiểu phải là 55 (tức 55.000đ).
                // Nếu bắt được số 50 (50.000đ), bot sẽ tự động ném đi vì đây là "giá ảo/phí bốc vác".
                if (numInt >= 55 && numInt <= 125) {
                    return { val: numInt * 1000, url: gnUrl };
                }
            }
        }
    }
    return null;
}

// Mạng nhện từ khóa tung diện rộng
async function extractConstructionPriceSpider(type) {
    const queries = type === 'steel' 
        ? ['"giá thép" "hòa phát"', '"giá thép" "hôm nay"', '"thép CB300"']
        : ['"giá xi măng" "scg"', '"giá xi măng" "hôm nay"', '"giá xi măng" "đồng/bao"'];
        
    for (let q of queries) {
        const result = await extractFromGoogleNews(q, type);
        if (result) return result; 
    }
    
    throw new Error("Không bắt được giá của thương hiệu mục tiêu trong khoảng thực tế");
}

// ==========================================
// MODULE 1: GIÁ THÉP XÂY DỰNG
// ==========================================
async function fetchSteelPrice() {
    let rawResult = {
        indicator_id: "vn_steel_cb300",
        name: "Thép CB300 (Hòa Phát)",
        unit: "Tr/tấn",
        country: "VN",
        frequency: "monthly",
        retrieved_at: new Date().toISOString()
    };

    try {
        const result = await extractConstructionPriceSpider('steel');
        return { 
            ...rawResult, 
            value: result.val, 
            source: { name: "Báo chí (Google News)", url: result.url, type: "news_scraping" }, 
            quality: { status: "verified", method: "brand_locked_spider" } 
        };
    } catch (err) {
        console.warn(`[Steel] Khóa mục tiêu thất bại: ${err.message}. Kích hoạt số tĩnh.`);
        return { 
            ...rawResult, 
            value: 14.21, 
            status: "offline_fallback",
            source: { name: "Giá tham chiếu (Hòa Phát)", type: "fallback" }, 
            quality: { status: "failed_but_cached", method: "hardcode", error_log: err.message } 
        };
    }
}

// ==========================================
// MODULE 2: GIÁ XI MĂNG
// ==========================================
async function fetchCementPrice() {
    let rawResult = {
        indicator_id: "vn_cement",
        name: "Xi măng (Bao 50kg)",
        unit: "VNĐ/bao",
        country: "VN",
        frequency: "monthly",
        retrieved_at: new Date().toISOString()
    };

    try {
        const result = await extractConstructionPriceSpider('cement');
        return { 
            ...rawResult, 
            value: result.val, 
            source: { name: "Báo chí (Google News)", url: result.url, type: "news_scraping" }, 
            quality: { status: "verified", method: "brand_locked_spider" } 
        };
    } catch (err) {
        console.warn(`[Cement] Khóa mục tiêu thất bại: ${err.message}. Kích hoạt số tĩnh.`);
        return { 
            ...rawResult, 
            value: 80000, 
            status: "offline_fallback",
            source: { name: "Giá tham chiếu (SCG/INSEE)", type: "fallback" }, 
            quality: { status: "failed_but_cached", method: "hardcode", error_log: err.message } 
        };
    }
}

// ==========================================
// TEST MÔI TRƯỜNG LOCAL
// ==========================================
if (require.main === module) {
    console.log("🚀 Đang khởi động kiểm tra cào Vật liệu Xây dựng (Siết chặt biên độ giá)...");
    
    Promise.all([fetchSteelPrice(), fetchCementPrice()])
        .then(results => {
            console.log("\n✅ [THÉP XÂY DỰNG] KẾT QUẢ CÀO DỮ LIỆU:");
            console.log(JSON.stringify(results[0], null, 2));
            
            console.log("\n✅ [XI MĂNG] KẾT QUẢ CÀO DỮ LIỆU:");
            console.log(JSON.stringify(results[1], null, 2));
        })
        .catch(err => {
            console.error("\n❌ LỖI NGHIÊM TRỌNG:", err);
        });
}

module.exports = { fetchSteelPrice, fetchCementPrice };

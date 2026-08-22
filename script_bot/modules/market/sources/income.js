// FILE: script_bot/modules/market/sources/income.js
const cheerio = require('cheerio');
const { fetchHtmlSafe } = require('../collector/parser_engine');

// Hàm trích xuất thông minh từ Google News 
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
        
        if (type === 'wage') {
            // BỘ LỌC CHỐNG TIN ĐỒN: Loại bỏ ngay lập tức các bài báo mang tính đề xuất, dự kiến
            if (fullText.includes('đề xuất') || fullText.includes('dự kiến') || fullText.includes('trình chính phủ')) {
                continue; 
            }

            // Định dạng 1: Báo chí viết tắt "5,31 triệu đồng"
            let match1 = fullText.match(/(?:vùng\s*1|vùng\s*i)[\s\S]{0,60}?([4-6][.,][0-9]{1,2})\s*(?:triệu)/i);
            if (match1) {
                let numFloat = parseFloat(match1[1].replace(',', '.'));
                let numInt = Math.round(numFloat * 1000000); 
                if (numInt >= 4900000 && numInt <= 6000000) return { val: numInt, url: gnUrl };
            }

            // Định dạng 2: Báo chí viết đầy đủ "5.310.000 đồng"
            let match2 = fullText.match(/(?:vùng\s*1|vùng\s*i)[\s\S]{0,60}?([4-6][.,\s]?[0-9]{3}[.,\s]?[0-9]{3})\s*(?:đồng|đ)/i);
            if (match2) {
                let numInt = parseInt(match2[1].replace(/[^\d]/g, ''));
                if (numInt >= 4900000 && numInt <= 6000000) return { val: numInt, url: gnUrl };
            }
        }
        
        if (type === 'interest') {
            // ÉP BUỘC SỐ THẬP PHÂN: Xóa bỏ khả năng bắt số nguyên, ép bot tìm cấu trúc "5,2%" hoặc "7,5%"
            const regex = /(?:vietcombank|vcb|lãi\s*suất)[\s\S]{0,80}?([5-9][.,][0-9]{1,2}|1[0-2][.,][0-9]{1,2})\s*(?:%|phần\s*trăm)/gi;
            const matches = [...fullText.matchAll(regex)];
            
            for (let m of matches) {
                let numFloat = parseFloat(m[1].replace(',', '.'));
                // Lấy số thập phân đầu tiên hợp lệ (ưu đãi ngân hàng từ 5.0 đến 11.0)
                if (numFloat >= 5.0 && numFloat <= 11.0) {
                    return { val: numFloat, url: gnUrl };
                }
            }
        }
    }
    return null;
}

// Mạng nhện từ khóa dò tìm chính xác
async function extractIncomeSpider(type) {
    const queries = type === 'wage' 
        ? ['"chính thức" "lương tối thiểu vùng I"', '"áp dụng" "lương tối thiểu vùng 1" "đồng"', '"Nghị định" "lương tối thiểu vùng I"']
        : ['"lãi suất vay mua nhà" "Vietcombank"', '"lãi suất ưu đãi" "Vietcombank" "%/năm"'];
        
    for (let q of queries) {
        const result = await extractFromGoogleNews(q, type);
        if (result) return result; 
    }
    throw new Error("Không bắt được dữ liệu hợp lệ từ báo chí");
}

// ==========================================
// 1. MODULE MỨC LƯƠNG TỐI THIỂU (VÙNG 1)
// ==========================================
async function fetchMinimumWage() {
    let rawResult = {
        indicator_id: "vn_wage_tier1",
        name: "Lương tối thiểu (Vùng 1)",
        unit: "VNĐ/tháng",
        country: "VN",
        frequency: "yearly",
        retrieved_at: new Date().toISOString()
    };
    try {
        const result = await extractIncomeSpider('wage');
        return { ...rawResult, value: result.val, source: { name: "Báo chí (Google News)", url: result.url, type: "news_scraping" }, quality: { status: "verified", method: "google_spider" } };
    } catch (err) {
        return { ...rawResult, value: 5310000, status: "offline_fallback", source: { name: "Nghị định 293/2025/NĐ-CP", type: "fallback" }, quality: { status: "failed_but_cached", method: "hardcode", error_log: err.message } };
    }
}

// ==========================================
// 2. MODULE LÃI SUẤT VAY BẤT ĐỘNG SẢN (VIETCOMBANK)
// ==========================================
async function fetchLoanInterest() {
    let rawResult = {
        indicator_id: "vn_mortgage_rate",
        name: "Lãi suất vay BĐS (Vietcombank)",
        unit: "%/năm",
        country: "VN",
        frequency: "monthly",
        retrieved_at: new Date().toISOString()
    };
    try {
        const result = await extractIncomeSpider('interest');
        return { ...rawResult, value: result.val, source: { name: "Báo chí (Google News)", url: result.url, type: "news_scraping" }, quality: { status: "verified", method: "google_spider" } };
    } catch (err) {
        return { ...rawResult, value: 6.5, status: "offline_fallback", source: { name: "Tham chiếu Benchmark", type: "fallback" }, quality: { status: "failed_but_cached", method: "hardcode", error_log: err.message } };
    }
}

// ==========================================
// TEST LOCAL
// ==========================================
if (require.main === module) {
    console.log("🚀 Đang khởi động kiểm tra cào Dữ liệu (Bộ lọc Anti-Proposal & Strict Decimal)...");
    Promise.all([fetchMinimumWage(), fetchLoanInterest()]).then(results => {
        console.log("\n✅ [LƯƠNG TỐI THIỂU] KẾT QUẢ:", JSON.stringify(results[0], null, 2));
        console.log("\n✅ [LÃI SUẤT VAY BĐS] KẾT QUẢ:", JSON.stringify(results[1], null, 2));
    }).catch(console.error);
}

module.exports = { fetchMinimumWage, fetchLoanInterest };

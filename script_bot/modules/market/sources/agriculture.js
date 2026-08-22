// FILE: script_bot/modules/market/sources/agriculture.js
const cheerio = require('cheerio');

// --- CÁC HÀM HỖ TRỢ DÙNG CHUNG ---

// Hàm trích xuất giá từ RSS của TinTayNguyen
function extractAgriPrice(xml, keyword) {
    const $ = cheerio.load(xml, { xmlMode: true });
    let price = null;
    $('item').each((i, el) => {
        if (price) return;
        const title = $(el).find('title').text().toLowerCase();
        const desc = $(el).find('description').text();
        
        if (title.includes(keyword)) {
            // Bắt số 5-6 chữ số (VD 120.000, 120000, 75.500)
            const match = desc.match(/([1-9][0-9]{1,2}[.,\s]?[0-9]{3})/);
            if (match) {
                price = parseInt(match[1].replace(/[^\d]/g, ''));
            }
        }
    });
    return price;
}

// Hàm trích xuất thông minh từ Google News (Tự sắp xếp thời gian)
function extractNewsPrice(xml, minVal, maxVal) {
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
    
    // Ưu tiên bài báo mới xuất bản nhất
    newsItems.sort((a, b) => b.pubDate - a.pubDate);
    
    for (const item of newsItems) {
        const fullText = item.title + " " + item.desc;
        const matches = fullText.match(/([1-9][0-9]{1,2}[.,\s]?[0-9]{3})/g);
        if (matches) {
            for (let m of matches) {
                const val = parseInt(m.replace(/[^\d]/g, ''));
                // Kiểm tra xem mức giá có nằm trong khoảng logic thực tế không
                if (val >= minVal && val <= maxVal) {
                    return val;
                }
            }
        }
    }
    return null;
}

// ==========================================
// MODULE 1: CÀ PHÊ ROBUSTA
// ==========================================
async function fetchCoffeeVN() {
    let rawResult = {
        indicator_id: "vn_coffee",
        name: "Cà phê Robusta",
        unit: "VNĐ/kg",
        country: "VN",
        retrieved_at: new Date().toISOString()
    };

    const rssUrl = 'https://tintaynguyen.com/feed/';

    try {
        // TẦNG 1: RSS Trực tiếp
        const res1 = await fetch(rssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
        if (!res1.ok) throw new Error("Bị chặn IP");
        const xml1 = await res1.text();
        
        const val1 = extractAgriPrice(xml1, 'giá cà phê');
        if (!val1) throw new Error("Không bắt được giá");

        return { ...rawResult, value: val1, source: { name: "TinTayNguyen", url: rssUrl, type: "official" }, quality: { status: "verified", method: "rss_direct" } };

    } catch (err1) {
        console.warn(`[Coffee] Tầng 1 thất bại: ${err1.message}. Chuyển sang Tầng 2 (Proxy)...`);
        try {
            // TẦNG 2: RSS qua Proxy
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
            const res2 = await fetch(proxyUrl, { timeout: 10000 });
            const xml2 = await res2.text();
            
            const val2 = extractAgriPrice(xml2, 'giá cà phê');
            if (!val2) throw new Error("Proxy rỗng");

            return { ...rawResult, value: val2, source: { name: "TinTayNguyen", url: rssUrl, type: "official_proxy" }, quality: { status: "secondary", method: "rss_proxy" } };

        } catch (err2) {
            console.warn(`[Coffee] Tầng 2 thất bại: ${err2.message}. Kích hoạt Google News...`);
            try {
                // TẦNG 3: Google News (Giới hạn logic giá cà phê từ 50.000 đến 200.000 VNĐ)
                const query = encodeURIComponent('"giá cà phê" "hôm nay"');
                const gnUrl = `https://news.google.com/rss/search?q=${query}&hl=vi&gl=VN&ceid=VN:vi`;
                const res3 = await fetch(gnUrl, { timeout: 10000 });
                const xml3 = await res3.text();
                
                const val3 = extractNewsPrice(xml3, 50000, 200000);
                if (!val3) throw new Error("Không tìm thấy giá hợp lệ trên báo");

                return { ...rawResult, value: val3, source: { name: "Báo chí (Google News)", url: gnUrl, type: "news_scraping" }, quality: { status: "tertiary", method: "google_news" } };

            } catch (err3) {
                console.warn(`[Coffee] Tầng 3 thất bại: ${err3.message}. Kích hoạt số tĩnh.`);
                // TẦNG 4: Số tĩnh dự phòng (Ví dụ: 120.500)
                return { ...rawResult, value: 120500, status: "offline_fallback", source: { name: "Dự phòng", type: "fallback" }, quality: { status: "failed_but_cached", method: "hardcode" } };
            }
        }
    }
}

// ==========================================
// MODULE 2: HỒ TIÊU
// ==========================================
async function fetchPepperVN() {
    let rawResult = {
        indicator_id: "vn_pepper",
        name: "Hồ tiêu",
        unit: "VNĐ/kg",
        country: "VN",
        retrieved_at: new Date().toISOString()
    };

    const rssUrl = 'https://tintaynguyen.com/feed/';

    try {
        // TẦNG 1: RSS Trực tiếp
        const res1 = await fetch(rssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
        if (!res1.ok) throw new Error("Bị chặn IP");
        const xml1 = await res1.text();
        
        const val1 = extractAgriPrice(xml1, 'giá tiêu');
        if (!val1) throw new Error("Không bắt được giá");

        return { ...rawResult, value: val1, source: { name: "TinTayNguyen", url: rssUrl, type: "official" }, quality: { status: "verified", method: "rss_direct" } };

    } catch (err1) {
        console.warn(`[Pepper] Tầng 1 thất bại: ${err1.message}. Chuyển sang Tầng 2 (Proxy)...`);
        try {
            // TẦNG 2: RSS qua Proxy
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
            const res2 = await fetch(proxyUrl, { timeout: 10000 });
            const xml2 = await res2.text();
            
            const val2 = extractAgriPrice(xml2, 'giá tiêu');
            if (!val2) throw new Error("Proxy rỗng");

            return { ...rawResult, value: val2, source: { name: "TinTayNguyen", url: rssUrl, type: "official_proxy" }, quality: { status: "secondary", method: "rss_proxy" } };

        } catch (err2) {
            console.warn(`[Pepper] Tầng 2 thất bại: ${err2.message}. Kích hoạt Google News...`);
            try {
                // TẦNG 3: Google News (Giới hạn logic giá hồ tiêu từ 70.000 đến 300.000 VNĐ)
                const query = encodeURIComponent('"giá tiêu" "hôm nay"');
                const gnUrl = `https://news.google.com/rss/search?q=${query}&hl=vi&gl=VN&ceid=VN:vi`;
                const res3 = await fetch(gnUrl, { timeout: 10000 });
                const xml3 = await res3.text();
                
                const val3 = extractNewsPrice(xml3, 70000, 300000);
                if (!val3) throw new Error("Không tìm thấy giá hợp lệ trên báo");

                return { ...rawResult, value: val3, source: { name: "Báo chí (Google News)", url: gnUrl, type: "news_scraping" }, quality: { status: "tertiary", method: "google_news" } };

            } catch (err3) {
                console.warn(`[Pepper] Tầng 3 thất bại: ${err3.message}. Kích hoạt số tĩnh.`);
                // TẦNG 4: Số tĩnh dự phòng (Ví dụ: 150.000)
                return { ...rawResult, value: 150000, status: "offline_fallback", source: { name: "Dự phòng", type: "fallback" }, quality: { status: "failed_but_cached", method: "hardcode" } };
            }
        }
    }
}

// ==========================================
// TEST MÔI TRƯỜNG LOCAL (Chạy cả Cà Phê & Hồ Tiêu)
// ==========================================
if (require.main === module) {
    console.log("🚀 Đang khởi động kiểm tra cào Nông sản (Chiến thuật Xuyên tường lửa)...");
    
    // Gọi đồng thời cả 2 hàm cào dữ liệu
    Promise.all([fetchCoffeeVN(), fetchPepperVN()])
        .then(results => {
            console.log("\n✅ [CÀ PHÊ] KẾT QUẢ CÀO DỮ LIỆU:");
            console.log(JSON.stringify(results[0], null, 2));
            
            console.log("\n✅ [HỒ TIÊU] KẾT QUẢ CÀO DỮ LIỆU:");
            console.log(JSON.stringify(results[1], null, 2));
        })
        .catch(err => {
            console.error("\n❌ LỖI NGHIÊM TRỌNG:", err);
        });
}

module.exports = { fetchCoffeeVN, fetchPepperVN };

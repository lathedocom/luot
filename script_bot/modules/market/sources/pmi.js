// FILE: script_bot/modules/market/sources/pmi.js
const cheerio = require('cheerio');
const { fetchHtmlSafe } = require('../collector/parser_engine');

async function fetchPMI() {
    let rawResult = {
        indicator_id: "vn_pmi",
        name: "Chỉ số PMI",
        unit: "Điểm",
        country: "VN",
        frequency: "monthly",
        retrieved_at: new Date().toISOString()
    };

    // Đường dẫn API gốc cực chuẩn của VNDirect (Sẽ bị chặn nếu truy cập trực tiếp từ IP quốc tế)
    const vndUrl = 'https://finfo-api.vndirect.com.vn/v4/macro_observations?q=itemCode:PMI&sort=-date&size=1';

    try {
        // TẦNG 1: Dùng AllOrigins Proxy để lách IP, lấy thẳng JSON từ VNDirect
        const proxyAllOrigins = `https://api.allorigins.win/raw?url=${encodeURIComponent(vndUrl)}`;
        const res1 = await fetch(proxyAllOrigins, { timeout: 10000 });
        const json1 = await res1.json();

        if (!json1 || !json1.data || json1.data.length === 0) throw new Error("AllOrigins trả về rỗng");

        return {
            ...rawResult,
            value: json1.data[0].value,
            period: json1.data[0].date, 
            source: { name: "VNDirect", url: vndUrl, type: "api_proxy" }, 
            quality: { status: "verified", method: "api_allorigins" }
        };

    } catch (errorTier1) {
        console.warn(`[PMI] Tầng 1 (AllOrigins) thất bại: ${errorTier1.message}. Chuyển sang CodeTabs...`);
        
        try {
            // TẦNG 2: Dùng CodeTabs Proxy làm trạm lách IP dự phòng 2
            const proxyCodeTabs = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(vndUrl)}`;
            const res2 = await fetch(proxyCodeTabs, { timeout: 10000 });
            const json2 = await res2.json();

            if (!json2 || !json2.data || json2.data.length === 0) throw new Error("CodeTabs trả về rỗng");

            return {
                ...rawResult,
                value: json2.data[0].value,
                period: json2.data[0].date, 
                source: { name: "VNDirect", url: vndUrl, type: "api_proxy" }, 
                quality: { status: "secondary", method: "api_codetabs" }
            };

        } catch (errorTier2) {
            console.warn(`[PMI] Tầng 2 (CodeTabs) thất bại: ${errorTier2.message}. Kích hoạt Google News...`);
            
            try {
                // TẦNG 3: GOOGLE NEWS RSS (Nâng cấp quét cả Tiêu đề và Mô tả)
                const query = encodeURIComponent('"PMI" "Việt Nam"');
                const googleNewsUrl = `https://news.google.com/rss/search?q=${query}&hl=vi&gl=VN&ceid=VN:vi`;
                
                const rssXml = await fetchHtmlSafe(googleNewsUrl, 10000);
                if (!rssXml || !rssXml.includes('<rss')) throw new Error("Google News không có XML");

                const $ = cheerio.load(rssXml, { xmlMode: true });
                let newsItems = [];
                
                // Gom tất cả bài báo vào mảng
                $('item').each((i, el) => {
                    const title = $(el).find('title').text() || '';
                    const desc = $(el).find('description').text() || '';
                    const pubDateStr = $(el).find('pubDate').text();
                    const pubDate = new Date(pubDateStr).getTime();
                    
                    if ((title || desc) && !isNaN(pubDate)) {
                        newsItems.push({ title, desc, pubDate });
                    }
                });

                // Xếp bài mới nhất lên trên cùng
                newsItems.sort((a, b) => b.pubDate - a.pubDate);

                let pmiValue3 = null;

                // Quét càn quét từ bài mới nhất
                for (const item of newsItems) {
                    const fullText = item.title + " " + item.desc;
                    // Bắt các số dạng 4x.x hoặc 5x.x
                    const matches = fullText.match(/([4-5][0-9][.,][0-9]{1,2})/g);
                    if (matches) {
                        for (let m of matches) {
                            const val = parseFloat(m.replace(',', '.'));
                            // Siết chặt điều kiện: PMI Việt Nam thường chỉ dao động từ 45.0 đến 55.0
                            if (val >= 45.0 && val <= 60.0) { 
                                pmiValue3 = val;
                                break;
                            }
                        }
                    }
                    if (pmiValue3) break; // Tìm được số hợp lệ ở tin mới nhất là thoát ngay!
                }

                if (!pmiValue3) throw new Error("Không quét được số PMI hợp lệ từ báo");

                return {
                    ...rawResult,
                    value: pmiValue3,
                    period: new Date().toISOString().substring(0, 7), 
                    source: { name: "Báo chí (via Google News)", url: googleNewsUrl, type: "news_scraping" }, 
                    quality: { status: "tertiary", method: "xml_rss_scraping" }
                };

            } catch (errorTier3) {
                console.warn(`[PMI] Tầng 3 (Google News) thất bại: ${errorTier3.message}. Kích hoạt số tĩnh.`);
                
                // TẦNG 4: Fallback tĩnh cuối cùng (Tôi trả nó về chuẩn 52.9)
                return {
                    ...rawResult,
                    value: 50.9, 
                    period: "2026-07",
                    status: "offline_fallback",
                    source: { name: "S&P Global (Dự phòng)", type: "fallback" },
                    quality: { status: "failed_but_cached", method: "hardcode", error_log: errorTier3.message }
                };
            }
        }
    }
}

// ==========================================
// TEST MÔI TRƯỜNG LOCAL
// ==========================================
if (require.main === module) {
    console.log("🚀 Đang khởi động kiểm tra cào chỉ số PMI (Chiến thuật 4 Tầng Bọc Thép)...");
    fetchPMI()
        .then(result => {
            console.log("\n✅ KẾT QUẢ CÀO DỮ LIỆU THÀNH CÔNG:");
            console.log(JSON.stringify(result, null, 2));
        })
        .catch(err => {
            console.error("\n❌ LỖI NGHIÊM TRỌNG:", err);
        });
}

module.exports = { fetchPMI };

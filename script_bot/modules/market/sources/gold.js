// FILE: script_bot/modules/market/sources/gold.js
const cheerio = require('cheerio');
const { fetchHtmlSafe } = require('../collector/parser_engine');

async function fetchGoldSJC() {
    let rawResult = {
        indicator_id: "vn_gold_sjc",
        name: "Vàng miếng SJC",
        unit: "Tr/lượng",
        country: "VN",
        frequency: "daily",
        retrieved_at: new Date().toISOString()
    };
    
    try {
        // Mở rộng lưới từ khóa
        const queries = ['"vàng SJC" "triệu đồng"', '"vàng miếng SJC" "hôm nay"'];
        let finalVal = null;
        let finalUrl = "";

        for (let q of queries) {
            const query = encodeURIComponent(q);
            const gnUrl = `https://news.google.com/rss/search?q=${query}&hl=vi&gl=VN&ceid=VN:vi`;
            
            const xml = await fetchHtmlSafe(gnUrl, 10000);
            if (!xml || !xml.includes('<rss')) continue;
            
            const $ = cheerio.load(xml, { xmlMode: true });
            let newsItems = [];
            
            $('item').each((i, el) => {
                const title = $(el).find('title').text();
                const desc = $(el).find('description').text();
                const pubDate = new Date($(el).find('pubDate').text()).getTime();
                if ((title || desc) && !isNaN(pubDate)) newsItems.push({ title, desc, pubDate });
            });
            
            newsItems.sort((a, b) => b.pubDate - a.pubDate);
            
            for (const item of newsItems) {
                const fullText = (item.title + " " + item.desc).toLowerCase();
                
                // Bắt định dạng: "85,5 triệu" hoặc "85.500.000 đồng" (Biên độ 70 - 150 triệu)
                let matchTrieu = fullText.match(/(?:sjc|vàng miếng)[\s\S]{0,60}?([7-9][0-9]|1[0-5][0-9])(?:[.,]([0-9]{1,2}))?\s*(?:triệu)/i);
                if (matchTrieu) {
                    let numStr = matchTrieu[1] + (matchTrieu[2] ? '.' + matchTrieu[2] : '');
                    finalVal = parseFloat(numStr);
                    finalUrl = gnUrl;
                    break;
                }
            }
            if (finalVal) break;
        }

        if (!finalVal) throw new Error("Không tìm thấy mức giá chuẩn trong bài báo");

        return { 
            ...rawResult, 
            value: finalVal, 
            source: { name: "Báo chí (Google News)", url: finalUrl, type: "news_scraping" }, 
            quality: { status: "verified", method: "google_spider" } 
        };
    } catch (error) {
        return {
            ...rawResult,
            value: 85.5,
            status: "offline_fallback",
            source: { name: "Giá tham chiếu", type: "fallback" },
            quality: { status: "failed_but_cached", method: "hardcode", error_log: error.message }
        };
    }
}

module.exports = { fetchGoldSJC };

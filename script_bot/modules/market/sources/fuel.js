// FILE: script_bot/modules/market/sources/fuel.js
const cheerio = require('cheerio');
const { fetchHtmlSafe, extractPriceFlexible } = require('../collector/parser_engine');

async function fetchFuelData() {
    let rawResult = {
        indicator_id: "vn_ron95",
        name: "Xăng RON95-III",
        unit: "VNĐ/Lít",
        country: "VN",
        retrieved_at: new Date().toISOString()
    };
    
    try {
        // TẦNG 1: Sử dụng Báo Mới làm nguồn ưu tiên
        const url = 'https://baomoi.com/tien-ich-gia-xang-dau.epi';
        
        // Sử dụng hàm fetchHtmlSafe có sẵn của bạn để chống lỗi mạng / timeout
        const html = await fetchHtmlSafe(url, 10000); 
        const $ = cheerio.load(html);
        
        let priceVal = null;

        // CÁCH 1: Tìm thông qua thẻ <a> chứa slug URL (Dựa trên thẻ bạn vừa gửi)
        // Tìm thẻ a có href chứa cụm từ 'ron-95'
        const targetElement = $('a[href*="ron-95"]');
        
        if (targetElement.length > 0) {
            // Lấy toàn bộ text của component chứa nó (thường cách 1-2 thẻ cha sẽ chứa cả giá)
            const parentText = targetElement.parent().parent().text();
            
            // Dùng Regex bắt chuỗi số có định dạng giá (VD: 23.210 hoặc 23,210)
            const match = parentText.match(/([1-9][0-9]{0,3}[.,\s]?[0-9]{3})/);
            if (match) {
                priceVal = parseInt(match[1].replace(/[^\d]/g, ''));
            }
        }

        // CÁCH 2 (Fallback): Nếu cấu trúc DOM Báo Mới thay đổi, 
        // dùng hàm extractPriceFlexible của bạn để quét toàn bộ body
        if (!priceVal) {
             const valStr = extractPriceFlexible(
                html, 
                ['body'], // Quét trên toàn bộ HTML
                /(?:RON 95-III).*?([1-9][0-9]{0,3}[.,\s]?[0-9]{3})/i
            );
            priceVal = parseInt(valStr.replace(/[^\d]/g, ''));
        }

        if (!priceVal) throw new Error("Không bắt được giá xăng từ Báo Mới");

        return { 
            ...rawResult, 
            value: priceVal, 
            source: { name: "Báo Mới", url: url, type: "official" }, 
            quality: { status: "verified", method: "html_text" } 
        };

    } catch (errTier1) {
        console.warn(`[Fuel Adapter] Lỗi cào Báo Mới: ${errTier1.message}. Chuyển sang WebGia...`);
        
        // TẦNG 2: Giữ lại trang WebGia cũ của bạn làm Fallback dự phòng
        try {
            const url2 = 'https://webgia.com/gia-xang-dau/petrolimex/';
            const html2 = await fetchHtmlSafe(url2, 10000);
            
            const valStr = extractPriceFlexible(
                html2, 
                ['table tbody tr', '.price-table tr', 'table tr'], 
                /(?:RON 95-III).*?([1-9][0-9]{0,3}[.,\s]?[0-9]{3})/i
            );
            const priceVal = parseInt(valStr.replace(/[^\d]/g, ''));
            
            return { 
                ...rawResult, 
                value: priceVal, 
                source: { name: "WebGia", url: url2, type: "secondary" }, 
                quality: { status: "secondary", method: "html_text" } 
            };
        } catch (errTier2) {
            return { 
                ...rawResult, 
                value: null, 
                source: { name: "Unknown", type: "none" }, 
                quality: { status: "failed", method: "none", error_log: errTier1.message } 
            };
        }
    }
}

module.exports = { fetchFuelData };

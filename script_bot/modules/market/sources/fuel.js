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
        // TẦNG 1: BÁO MỚI (Ưu tiên số 1)
        const url1 = 'https://baomoi.com/tien-ich-gia-xang-dau.epi';
        const html1 = await fetchHtmlSafe(url1, 10000); 
        const $1 = cheerio.load(html1);
        let priceVal1 = null;

        const targetElement = $1('a[href*="ron-95"]');
        if (targetElement.length > 0) {
            const parentText = targetElement.parent().parent().text();
            const match = parentText.match(/([1-3][0-9][.,\s]?[0-9]{3})/);
            if (match) priceVal1 = parseInt(match[1].replace(/[^\d]/g, ''));
        }

        if (!priceVal1) {
             const valStr = extractPriceFlexible(html1, ['body'], /(?:RON\s*95(?:-III)?).*?([1-3][0-9]{0,3}[.,\s]?[0-9]{3})/i);
             if (valStr) priceVal1 = parseInt(valStr.replace(/[^\d]/g, ''));
        }

        if (!priceVal1 || isNaN(priceVal1)) throw new Error("Không bắt được giá xăng từ Báo Mới");

        return { ...rawResult, value: priceVal1, source: { name: "Báo Mới", url: url1, type: "official" }, quality: { status: "verified", method: "html_text" } };

    } catch (errTier1) {
        console.warn(`[Fuel] Lỗi Tầng 1 (Báo Mới): ${errTier1.message}. Chuyển sang Tầng 2...`);
        
        try {
            // TẦNG 2: CHỢ GIÁ (Nguồn mới bổ sung, dữ liệu cập nhật rất tốt)
            const url2 = 'https://chogia.vn/gia-xang-dau/';
            const html2 = await fetchHtmlSafe(url2, 10000);
            let priceVal2 = null;
            
            const valStr2 = extractPriceFlexible(
                html2, 
                ['body'], 
                // Regex linh hoạt bắt RON 95, RON95-III, v.v.
                /(?:RON\s*95(?:-III)?).*?([2-3][0-9][.,][0-9]{3})/i
            );
            if (valStr2) priceVal2 = parseInt(valStr2.replace(/[^\d]/g, ''));

            if (!priceVal2 || isNaN(priceVal2)) throw new Error("Không tìm thấy giá trên Chợ Giá");

            return { ...rawResult, value: priceVal2, source: { name: "Chợ Giá", url: url2, type: "secondary" }, quality: { status: "secondary", method: "html_text" } };

        } catch (errTier2) {
            console.warn(`[Fuel] Lỗi Tầng 2 (Chợ Giá): ${errTier2.message}. Chuyển sang Tầng 3...`);
            
            try {
                // TẦNG 3: WEBGIA (Bị đẩy xuống cuối vì đang bị lỗi "--")
                const url3 = 'https://webgia.com/gia-xang-dau/petrolimex/';
                const html3 = await fetchHtmlSafe(url3, 10000);
                let priceVal3 = null;
                const $3 = cheerio.load(html3);

                $3('table tbody tr').each((i, el) => {
                    const text = $3(el).text().trim();
                    // KIỂM TRA NGHIÊM NGẶT: Bỏ qua ngay dòng có chứa "--" để chống lỗi
                    if (text.includes('RON 95-III') && !text.includes('--')) {
                        const match = text.match(/([2-3][0-9][.,][0-9]{3})/);
                        if (match) priceVal3 = parseInt(match[1].replace(/[^\d]/g, ''));
                    }
                });

                if (!priceVal3) throw new Error("WebGia đang hiển thị '--' (trống dữ liệu)");

                return { ...rawResult, value: priceVal3, source: { name: "WebGia", url: url3, type: "tertiary" }, quality: { status: "tertiary", method: "html_text" } };

            } catch (errTier3) {
                console.warn(`[Fuel] Lỗi Tầng 3 (WebGia): ${errTier3.message}. Đánh dấu Offline.`);
                return { 
                    ...rawResult, 
                    value: null,
                    status: "offline", 
                    source: { name: "Nhiều nguồn", type: "none" }, 
                    quality: { status: "failed", method: "none", error_log: errTier3.message } 
                };
            }
        }
    }
}

module.exports = { fetchFuelData };
// ==========================================
// TEST MÔI TRƯỜNG LOCAL (Chỉ chạy khi gọi trực tiếp file này)
// ==========================================
if (require.main === module) {
    console.log("🚀 Đang khởi động kiểm tra cào giá xăng độc lập...");
    fetchFuelData()
        .then(result => {
            console.log("\n✅ KẾT QUẢ CÀO DỮ LIỆU THÀNH CÔNG:");
            console.log(JSON.stringify(result, null, 2));
        })
        .catch(err => {
            console.error("\n❌ LỖI NGHIÊM TRỌNG:", err);
        });
}

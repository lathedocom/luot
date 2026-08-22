// FILE: script_bot/modules/market/collector/index.js

// === BƯỚC 1: QUY TỤ TOÀN BỘ 15+ ADAPTER NGUỒN TỪ CÁC MODULE ===[cite: 1]
// Tầng A: Chi phí sinh hoạt
const { fetchRicePrice, fetchPorkPrice, fetchEggPrice } = require('../sources/food');
const { fetchRon95Price, fetchDieselPrice, fetchLpgPrice } = require('../sources/fuel');
const { fetchElectricityPrice, fetchWaterPrice } = require('../sources/utilities');
const { fetchCPI } = require('../sources/nso_cpi');

// Tầng B: Thu nhập & Sức mua
const { fetchMinimumWage, fetchLoanInterest } = require('../sources/income');

// Tầng C: Kinh tế & Tài sản
const { fetchUSDVND } = require('../sources/currency'); 
const { fetchGoldSJC } = require('../sources/gold'); 
const { fetchVNIndex } = require('../sources/stocks'); 
const { fetchBrentOil } = require('../sources/energy');
const { fetchPMI } = require('../sources/pmi');
const { fetchBitcoin } = require('../sources/crypto');

// === BƯỚC 2: MAPPING VÀ CHIA TẦNG KIẾN TRÚC MỚI (CHUẨN 2026) ===
const CORE_INDICATORS = [
    // TẦNG A: CHI PHÍ SINH HOẠT
    { id: 'vn_rice', parser: fetchRicePrice, category: 'Chi phí sinh hoạt', frequency: 'daily' },
    { id: 'vn_pork', parser: fetchPorkPrice, category: 'Chi phí sinh hoạt', frequency: 'daily' },
    { id: 'vn_egg', parser: fetchEggPrice, category: 'Chi phí sinh hoạt', frequency: 'daily' },
    { id: 'vn_ron95', parser: fetchRon95Price, category: 'Chi phí sinh hoạt', frequency: 'weekly' },
    { id: 'vn_diesel', parser: fetchDieselPrice, category: 'Chi phí sinh hoạt', frequency: 'weekly' },
    { id: 'vn_lpg_12kg', parser: fetchLpgPrice, category: 'Chi phí sinh hoạt', frequency: 'monthly' },
    { id: 'vn_electricity', parser: fetchElectricityPrice, category: 'Chi phí sinh hoạt', frequency: 'monthly' },
    { id: 'vn_water', parser: fetchWaterPrice, category: 'Chi phí sinh hoạt', frequency: 'monthly' },
    { id: 'vn_cpi', parser: fetchCPI, category: 'Chi phí sinh hoạt', frequency: 'monthly' },

    // TẦNG B: THU NHẬP & SỨC MUA
    { id: 'vn_wage_tier1', parser: fetchMinimumWage, category: 'Thu nhập & Sức mua', frequency: 'yearly' },
    { id: 'vn_mortgage_rate', parser: fetchLoanInterest, category: 'Thu nhập & Sức mua', frequency: 'monthly' },

    // TẦNG C: KINH TẾ & TÀI SẢN
    { id: 'usd_vnd', parser: fetchUSDVND, category: 'Kinh tế & Tài sản', frequency: 'realtime' },
    { id: 'vn_gold_sjc', parser: fetchGoldSJC, category: 'Kinh tế & Tài sản', frequency: 'daily' },
    { id: 'vn_index', parser: fetchVNIndex, category: 'Kinh tế & Tài sản', frequency: 'realtime' },
    { id: 'global_brent', parser: fetchBrentOil, category: 'Kinh tế & Tài sản', frequency: 'realtime' },
    { id: 'vn_pmi', parser: fetchPMI, category: 'Kinh tế & Tài sản', frequency: 'monthly' },
    { id: 'global_btc', parser: fetchBitcoin, category: 'Kinh tế & Tài sản', frequency: 'realtime' }
];

/**
 * Hàm thực thi thu thập dữ liệu thị trường theo chu kỳ
 * @param {string} runFrequency - 'realtime', 'daily', 'weekly', 'monthly', 'yearly', 'all'
 */
async function runCollector(runFrequency = "daily") {
    const results = [];
    console.log(`\n======================================================`);
    console.log(`📡 KHỞI ĐỘNG BỘ CÀO DỮ LIỆU ĐỜI SỐNG (TẦN SUẤT: ${runFrequency.toUpperCase()})`);
    console.log(`======================================================\n`);

    // Chạy ĐA LUỒNG siêu tốc
    const scrapePromises = CORE_INDICATORS.map(async (config) => {
        // Lọc theo chu kỳ (Bỏ qua nếu không đúng frequency, trừ khi gọi 'all')
        if (runFrequency !== "all" && config.frequency !== runFrequency && runFrequency !== "realtime") {
            if(runFrequency !== 'all') return null; 
        }

        const parserFunction = config.parser;
        if (!parserFunction) return null;

        try {
            // Dữ liệu đã được chuẩn hóa 100% từ trong ruột các Adapter
            let data = await parserFunction();
            
            if (!data) return null;

            // Gắn Meta-data Vĩ mô cho Dashboard UI
            data.category = config.category;

            // Log Kết Quả
            if (data.quality && data.quality.status === "failed") {
                console.log(`❌ THẤT BẠI [${data.name}]: ${data.quality.error_log || "Lỗi cào"}`);
            } else {
                let fallbackTag = data.status === "offline_fallback" ? " (Số tĩnh dự phòng)" : "";
                // Sửa biến price thành value chuẩn xác
                console.log(`✅ [${config.category.toUpperCase()}] ${data.name}: ${data.value} ${data.unit || ''}${fallbackTag}`);
            }

            return data;
        } catch (err) {
            console.error(`[LỖI CRASH] Kịch bản cào ${config.id} thất bại:`, err.message);
            return null;
        }
    });

    const resolvedData = await Promise.all(scrapePromises);
    
    for (const data of resolvedData) {
        if (data && (!data.quality || data.quality.status !== "failed")) {
            results.push(data);
        }
    }

    console.log(`\n🎯 Đã thu thập thành công ${results.length}/${CORE_INDICATORS.length} chỉ số.`);
    return results;
}

// TEST MÔI TRƯỜNG LOCAL
if (require.main === module) {
    runCollector("all").then(() => process.exit(0));
}

module.exports = { runCollector };

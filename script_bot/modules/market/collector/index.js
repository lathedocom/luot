// FILE: script_bot/modules/market/collector/index.js

const { validateMarketData } = require('./validator');
const { normalizeMarketData } = require('./normalizer'); 

// === BƯỚC 1: QUY TỤ TOÀN BỘ 15+ ADAPTER NGUỒN TỪ CÁC MODULE ===
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
// Khai báo trực tiếp tại đây để ép buộc Frontend hiển thị đúng 3 Nhóm Đời sống
const CORE_INDICATORS = [
    // -------------------------------------------------------------
    // TẦNG A: CHI PHÍ SINH HOẠT (Biến động mâm cơm & hóa đơn)
    // -------------------------------------------------------------
    { id: 'vn_rice', parser: fetchRicePrice, category: 'Chi phí sinh hoạt', frequency: 'daily' },
    { id: 'vn_pork', parser: fetchPorkPrice, category: 'Chi phí sinh hoạt', frequency: 'daily' },
    { id: 'vn_egg', parser: fetchEggPrice, category: 'Chi phí sinh hoạt', frequency: 'daily' },
    { id: 'vn_ron95', parser: fetchRon95Price, category: 'Chi phí sinh hoạt', frequency: 'weekly' },
    { id: 'vn_diesel', parser: fetchDieselPrice, category: 'Chi phí sinh hoạt', frequency: 'weekly' },
    { id: 'vn_lpg_12kg', parser: fetchLpgPrice, category: 'Chi phí sinh hoạt', frequency: 'monthly' },
    { id: 'vn_electricity', parser: fetchElectricityPrice, category: 'Chi phí sinh hoạt', frequency: 'monthly' },
    { id: 'vn_water', parser: fetchWaterPrice, category: 'Chi phí sinh hoạt', frequency: 'monthly' },
    { id: 'vn_cpi', parser: fetchCPI, category: 'Chi phí sinh hoạt', frequency: 'monthly' },

    // -------------------------------------------------------------
    // TẦNG B: THU NHẬP & SỨC MUA (Khả năng chi trả & Áp lực nợ nần)
    // -------------------------------------------------------------
    { id: 'vn_wage_tier1', parser: fetchMinimumWage, category: 'Thu nhập & Sức mua', frequency: 'yearly' },
    { id: 'vn_mortgage_rate', parser: fetchLoanInterest, category: 'Thu nhập & Sức mua', frequency: 'monthly' },

    // -------------------------------------------------------------
    // TẦNG C: KINH TẾ & TÀI SẢN (Nơi trú ẩn & Chỉ báo vĩ mô)
    // -------------------------------------------------------------
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

    // Chạy song song tất cả các luồng để tăng tốc độ cào (Pro-Tip)
    const scrapePromises = CORE_INDICATORS.map(async (config) => {
        // Scheduler: Lọc những chỉ số đúng chu kỳ
        if (runFrequency !== "all" && config.frequency !== runFrequency && runFrequency !== "realtime") {
            // Lưu ý: Nếu chạy daily, có thể bỏ qua monthly trừ khi được trigger đặc biệt.
            // Để hệ thống luôn update nhanh khi test, chúng ta tạm thời cho phép cào hết nếu tần suất là 'all'
            if(runFrequency !== 'all') return null; 
        }

        const parserFunction = config.parser;
        if (!parserFunction) {
            console.warn(`[CẢNH BÁO] Hàm cào dữ liệu cho ${config.id} chưa tồn tại.`);
            return null;
        }

        try {
            // 1. Chạy Adapter để cào dữ liệu thô
            let rawData = await parserFunction();

            // Gắn cứng Nhóm chuyên mục (Category) vào dữ liệu thô để hiển thị trên UI
            rawData.category = config.category;
            rawData.id = config.id;

            // 2. Ép khuôn và làm sạch dữ liệu (Normalizer)
            // (Truyền chính config hiện tại vào thay cho sourceConfig cũ của registry)
            let normalizedData = normalizeMarketData(rawData, config);

            // 3. Đưa qua màng lọc kiểm định (Validator)
            if (normalizedData.quality.status !== "failed" && normalizedData.value !== null) {
                const validation = validateMarketData(normalizedData, {}); // Pass rule nếu cần
                if (!validation.is_valid) {
                    normalizedData.quality.status = "failed";
                    normalizedData.quality.error_log = validation.errors.join(' | ');
                }
            }

            // 4. Log Kết Quả
            if (normalizedData.quality.status === "failed") {
                console.log(`❌ THẤT BẠI [${normalizedData.name}]: ${normalizedData.quality.error_log || "Lỗi cào"}`);
            } else {
                let fallbackTag = normalizedData.status === "offline_fallback" ? " (Số tĩnh)" : "";
                console.log(`✅ [${config.category.toUpperCase()}] ${normalizedData.name}: ${normalizedData.price} ${normalizedData.unit || ''}${fallbackTag}`);
            }

            return normalizedData;
        } catch (err) {
            console.error(`[LỖI CRASH] Kịch bản cào ${config.id} thất bại:`, err.message);
            return null;
        }
    });

    // Gom kết quả của các luồng chạy song song
    const resolvedData = await Promise.all(scrapePromises);
    
    // Loại bỏ các kết quả null (Do bị skip frequency hoặc crash)
    for (const data of resolvedData) {
        if (data) results.push(data);
    }

    console.log(`\n🎯 Đã thu thập thành công ${results.length}/${CORE_INDICATORS.length} chỉ số.`);
    return results;
}

// TEST MÔI TRƯỜNG LOCAL
if (require.main === module) {
    runCollector("all").then(() => process.exit(0));
}

module.exports = { runCollector };

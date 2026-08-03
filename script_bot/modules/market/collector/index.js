// FILE: script_bot/modules/market/collector/index.js

const { MARKET_SOURCES } = require('./source_registry');
const { validateMarketData } = require('./validator');
const { normalizeMarketData } = require('./normalizer'); 

// === IMPORT CÁC ADAPTER NGUỒN ===
const { fetchFuelData } = require('../sources/fuel');
const { fetchCPI } = require('../sources/nso_cpi');
const { fetchUSDVND } = require('../sources/currency'); 
const { fetchGoldSJC } = require('../sources/gold'); 
const { fetchVNIndex } = require('../sources/stocks'); 

// === MAPPING PARSER TỪ REGISTRY ===
const parserMap = {
    "fuel": fetchFuelData,
    "nso_cpi": fetchCPI,
    "usd_vnd": fetchUSDVND,
    "gold_sjc": fetchGoldSJC,
    "vn_index": fetchVNIndex
};

/**
 * Hàm thực thi thu thập dữ liệu thị trường theo chu kỳ
 * @param {string} runFrequency - 'realtime', 'daily', 'monthly', 'event', 'all'
 */
async function runCollector(runFrequency = "daily") {
    const results = [];

    for (const [key, sourceConfig] of Object.entries(MARKET_SOURCES)) {
        // Scheduler: Lọc những chỉ số đúng chu kỳ
        if (runFrequency !== "all" && sourceConfig.frequency !== runFrequency) {
            continue; 
        }

        const parserFunction = parserMap[sourceConfig.parser];
        if (!parserFunction) {
            console.error(`[CẢNH BÁO] Chưa cài đặt hàm Adapter cho parser: ${sourceConfig.parser}`);
            continue;
        }

        console.log(`Đang tiến hành thu thập: ${sourceConfig.name} (${sourceConfig.id})...`);
        
        try {
            // 1. Chạy Adapter để cào dữ liệu thô
            let rawData = await parserFunction();

            // 2. Ép khuôn và làm sạch dữ liệu (Normalizer)
            let normalizedData = normalizeMarketData(rawData, sourceConfig);

            // 3. Đưa qua màng lọc kiểm định (Validator)
            if (normalizedData.quality.status !== "failed" && normalizedData.value !== null) {
                const validation = validateMarketData(normalizedData, sourceConfig.validation);
                if (!validation.is_valid) {
                    console.warn(`[TỪ CHỐI] Số liệu ${sourceConfig.name} bất thường! Lỗi: ${validation.errors.join(', ')}`);
                    // Ghi đè trạng thái thành failed để hệ thống History bỏ qua
                    normalizedData.quality.status = "failed";
                    normalizedData.quality.error_log = validation.errors.join(' | ');
                }
            }

            results.push(normalizedData);
        } catch (err) {
            console.error(`[LỖI] Kịch bản cào ${sourceConfig.name} bị crash:`, err);
        }
    }

    return results;
}

module.exports = { runCollector };

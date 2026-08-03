// FILE: script_bot/modules/market/collector/index.js

const { MARKET_SOURCES } = require('./source_registry');
const { validateMarketData } = require('./validator');

// Import các adapter
const { fetchFuelData } = require('../sources/fuel');
const { fetchCPI } = require('../sources/nso_cpi'); 

// Map các string parser trong registry tới function thực tế
const parserMap = {
    "fuel": fetchFuelData,
    "nso_cpi": fetchCPI
};

async function runCollector(runFrequency = "daily") {
    const results = [];

    for (const [key, sourceConfig] of Object.entries(MARKET_SOURCES)) {
        // SCHEDULER: Chỉ thu thập những chỉ số đúng chu kỳ
        // (Hoặc thu thập nếu runFrequency truyền vào là 'all')
        if (runFrequency !== "all" && sourceConfig.frequency !== runFrequency) {
            continue; 
        }

        const parserFunction = parserMap[sourceConfig.parser];
        if (!parserFunction) {
            console.error(`Chưa cài đặt adapter cho: ${sourceConfig.parser}`);
            continue;
        }

        console.log(`Đang tiến hành thu thập: ${sourceConfig.name}...`);
        
        // Chạy Adapter cào dữ liệu
        let rawData = await parserFunction();

        // Nếu lấy thành công, đưa qua Validator kiểm tra
        if (rawData.quality.status !== "failed" && rawData.value !== null) {
            const validation = validateMarketData(rawData, sourceConfig.validation);
            if (!validation.is_valid) {
                console.warn(`[CẢNH BÁO] Số liệu ${sourceConfig.name} bất thường! Lỗi: ${validation.errors.join(', ')}`);
            }
        }

        results.push(rawData);
    }

    return results;
}

module.exports = { runCollector };

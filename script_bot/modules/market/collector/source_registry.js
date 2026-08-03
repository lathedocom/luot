// FILE: script_bot/modules/market/collector/source_registry.js

const MARKET_SOURCES = {
    // === NHÓM HÀNG NGÀY / THỜI GIAN THỰC (REALTIME & DAILY) ===
    vn_gold_sjc: {
        id: "vn_gold_sjc",
        name: "Vàng miếng SJC",
        type: "local",
        frequency: "daily",
        priority: 1,
        parser: "gold_sjc",
        validation: { min: 50, max: 150, unit: "Tr/lượng", max_change_percent: 10 }
    },
    vn_index: {
        id: "vn_index",
        name: "VN-Index",
        type: "api",
        frequency: "daily",
        priority: 1,
        parser: "vn_index",
        validation: { min: 500, max: 2000, unit: "Điểm", max_change_percent: 15 }
    },
    usd_vnd: {
        id: "usd_vnd",
        name: "Tỷ giá USD/VND",
        type: "api",
        frequency: "realtime",
        priority: 1,
        parser: "usd_vnd",
        validation: { min: 20000, max: 30000, unit: "VND", max_change_percent: 5 }
    },

    // === NHÓM SỰ KIỆN (EVENT-BASED) ===
    vn_ron95: {
        id: "vn_ron95",
        name: "Xăng RON95-III",
        type: "official",
        frequency: "event", 
        priority: 1,
        parser: "fuel",
        validation: { min: 15000, max: 35000, unit: "VND/liter", max_change_percent: 15 }
    },

    // === NHÓM HÀNG THÁNG (MONTHLY) ===
    vn_cpi: {
        id: "vn_cpi",
        name: "Lạm phát (CPI)",
        type: "official",
        frequency: "monthly",
        priority: 1,
        parser: "nso_cpi",
        validation: { min: -5, max: 20, unit: "%", max_change_percent: 100 }
    }
};

module.exports = { MARKET_SOURCES };

// FILE: script_bot/modules/market/collector/source_registry.js

const MARKET_SOURCES = {
    vn_ron95: {
        id: "vn_ron95",
        name: "Xăng RON95-III",
        type: "official",
        frequency: "event", // Chỉ lấy khi có sự kiện điều hành giá
        priority: 1,
        parser: "fuel",
        validation: {
            min: 15000,
            max: 35000,
            unit: "VND/liter",
            max_change_percent: 15 // Cảnh báo nếu giá tăng/giảm đột ngột quá 15%
        }
    },
    vn_cpi: {
        id: "vn_cpi",
        name: "Lạm phát (CPI)",
        type: "official",
        frequency: "monthly", // Chỉ cào 1 lần/tháng
        priority: 1,
        parser: "nso_cpi",
        validation: {
            min: -5,
            max: 20,
            unit: "%",
            max_change_percent: 100 // Lạm phát có thể giật cục, để biên độ rộng
        }
    }
};

module.exports = { MARKET_SOURCES };

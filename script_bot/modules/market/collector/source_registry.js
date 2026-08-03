// FILE: script_bot/modules/market/collector/source_registry.js

const MARKET_SOURCES = {
    // ==========================================
    // NHÓM REALTIME (Tỷ giá, Tiền điện tử, Hàng hóa Thế giới)
    // ==========================================
    usd_vnd: { id: "usd_vnd", name: "Tỷ giá USD/VND", type: "api", frequency: "realtime", priority: 1, parser: "currency", validation: { min: 20000, max: 30000, unit: "VND", max_change_percent: 5 } },
    global_btc: { id: "global_btc", name: "Bitcoin", type: "api", frequency: "realtime", priority: 1, parser: "crypto", validation: { min: 10000, max: 150000, unit: "USD", max_change_percent: 20 } },
    global_brent: { id: "global_brent", name: "Dầu Brent", type: "api", frequency: "realtime", priority: 1, parser: "energy", validation: { min: 20, max: 200, unit: "USD/thùng", max_change_percent: 15 } },

    // ==========================================
    // NHÓM DAILY (Chứng khoán, Vàng, Nông sản cơ bản)
    // ==========================================
    vn_index: { id: "vn_index", name: "VN-Index", type: "api", frequency: "daily", priority: 1, parser: "stocks", validation: { min: 500, max: 2000, unit: "Điểm", max_change_percent: 15 } },
    //vn_gold_sjc: { id: "vn_gold_sjc", name: "Vàng miếng SJC", type: "local", frequency: "daily", priority: 1, parser: "gold", validation: { min: 50, max: 150, unit: "Tr/lượng", max_change_percent: 10 } },
    vn_gold_sjc: { id: "vn_gold_sjc", name: "Vàng miếng SJC", type: "local", frequency: "daily", priority: 1, parser: "gold", validation: { min: 10, max: 150, unit: "Tr/lượng", max_change_percent: 10 } },
    
    vn_coffee: { id: "vn_coffee", name: "Cà phê Robusta", type: "local", frequency: "daily", priority: 2, parser: "agriculture_coffee", validation: { min: 30000, max: 200000, unit: "VNĐ/kg", max_change_percent: 10 } },
    vn_pepper: { id: "vn_pepper", name: "Hồ tiêu", type: "local", frequency: "daily", priority: 2, parser: "agriculture_pepper", validation: { min: 50000, max: 300000, unit: "VNĐ/kg", max_change_percent: 10 } },

    // ==========================================
    // NHÓM SỰ KIỆN (Xăng dầu)
    // ==========================================
    vn_ron95: { id: "vn_ron95", name: "Xăng RON95-III", type: "official", frequency: "event", priority: 1, parser: "fuel", validation: { min: 15000, max: 35000, unit: "VNĐ/Lít", max_change_percent: 15 } },

    // ==========================================
    // NHÓM HÀNG THÁNG (Vĩ mô, Xây dựng)
    // ==========================================
    vn_cpi: { id: "vn_cpi", name: "Lạm phát (CPI)", type: "official", frequency: "monthly", priority: 1, parser: "cpi", validation: { min: -5, max: 20, unit: "%", max_change_percent: 100 } },
    vn_pmi: { id: "vn_pmi", name: "Chỉ số PMI", type: "aggregate", frequency: "monthly", priority: 1, parser: "pmi", validation: { min: 30, max: 70, unit: "Điểm", max_change_percent: 30 } },
    vn_steel_cb300: { id: "vn_steel_cb300", name: "Thép CB300", type: "static", frequency: "monthly", priority: 3, parser: "construction_steel", validation: { min: 10, max: 30, unit: "Tr/tấn", max_change_percent: 20 } },
    vn_cement: { id: "vn_cement", name: "Xi măng", type: "static", frequency: "monthly", priority: 3, parser: "construction_cement", validation: { min: 0.5, max: 5, unit: "Tr/tấn", max_change_percent: 20 } }
};

module.exports = { MARKET_SOURCES };

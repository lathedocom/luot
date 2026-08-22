// FILE: script_bot/modules/market/collector/source_registry.js

const MARKET_SOURCES = {
    // ==========================================
    // NHÓM REALTIME (Tỷ giá, Tiền điện tử, Hàng hóa Thế giới)
    // ==========================================
    usd_vnd: { id: "usd_vnd", name: "Tỷ giá USD/VND", type: "api", frequency: "realtime", priority: 1, parser: "currency", validation: { min: 20000, max: 30000, unit: "VND", max_change_percent: 5 } },
    global_btc: { id: "global_btc", name: "Bitcoin", type: "api", frequency: "realtime", priority: 1, parser: "crypto", validation: { min: 10000, max: 150000, unit: "USD", max_change_percent: 20 } },
    global_brent: { id: "global_brent", name: "Dầu Brent", type: "api", frequency: "realtime", priority: 1, parser: "energy", validation: { min: 20, max: 200, unit: "USD/thùng", max_change_percent: 15 } },

    // ==========================================
    // NHÓM DAILY (Chứng khoán, Vàng, Nông sản cơ bản, Thực phẩm)
    // ==========================================
    vn_index: { id: "vn_index", name: "VN-Index", type: "api", frequency: "daily", priority: 1, parser: "stocks", validation: { min: 500, max: 2000, unit: "Điểm", max_change_percent: 15 } },
    vn_gold_sjc: { id: "vn_gold_sjc", name: "Vàng miếng SJC", type: "local", frequency: "daily", priority: 1, parser: "gold", validation: { min: 10, max: 150, unit: "Tr/lượng", max_change_percent: 10 } },
    
    vn_coffee: { id: "vn_coffee", name: "Cà phê Robusta", type: "local", frequency: "daily", priority: 2, parser: "agriculture_coffee", validation: { min: 30000, max: 200000, unit: "VNĐ/kg", max_change_percent: 10 } },
    vn_pepper: { id: "vn_pepper", name: "Hồ tiêu", type: "local", frequency: "daily", priority: 2, parser: "agriculture_pepper", validation: { min: 50000, max: 300000, unit: "VNĐ/kg", max_change_percent: 10 } },
    
    // THÊM MỚI: Nhóm thực phẩm thiết yếu
    vn_rice: { id: "vn_rice", name: "Gạo tẻ thường", type: "news_scraping", frequency: "daily", priority: 2, parser: "food_rice", validation: { min: 10000, max: 35000, unit: "VNĐ/kg", max_change_percent: 10 } },
    vn_pork: { id: "vn_pork", name: "Thịt heo hơi", type: "news_scraping", frequency: "daily", priority: 2, parser: "food_pork", validation: { min: 40000, max: 80000, unit: "VNĐ/kg", max_change_percent: 15 } },
    vn_egg: { id: "vn_egg", name: "Trứng gà công nghiệp", type: "news_scraping", frequency: "daily", priority: 2, parser: "food_egg", validation: { min: 1500, max: 5000, unit: "VNĐ/quả", max_change_percent: 15 } },

    // ==========================================
    // NHÓM XÂY DỰNG (Đã chuyển sang Daily để hiện lên Bảng giá)
    // ==========================================
    vn_steel_cb300: { id: "vn_steel_cb300", name: "Thép CB300", type: "static", frequency: "daily", priority: 3, parser: "construction_steel", validation: { min: 10, max: 30, unit: "Tr/tấn", max_change_percent: 20 } },
    vn_cement: { id: "vn_cement", name: "Xi măng", type: "static", frequency: "daily", priority: 3, parser: "construction_cement", validation: { min: 0.5, max: 5, unit: "Tr/tấn", max_change_percent: 20 } },

    // ==========================================
    // NHÓM SỰ KIỆN / DAILY (Xăng dầu)
    // ==========================================
    vn_ron95: { id: "vn_ron95", name: "Xăng RON95-III", type: "official", frequency: "daily", priority: 1, parser: "fuel", validation: { min: 15000, max: 35000, unit: "VNĐ/Lít", max_change_percent: 15 } },
    // THÊM MỚI: Dầu DO
    vn_diesel: { id: "vn_diesel", name: "Dầu DO 0,05S-II", type: "official", frequency: "daily", priority: 1, parser: "fuel_diesel", validation: { min: 10000, max: 35000, unit: "VNĐ/lít", max_change_percent: 15 } },

    // ==========================================
    // NHÓM HÀNG THÁNG (Vĩ mô, Tiện ích, Lương, Lãi suất)
    // ==========================================
    vn_cpi: { id: "vn_cpi", name: "Lạm phát (CPI)", type: "official", frequency: "monthly", priority: 1, parser: "cpi", validation: { min: -5, max: 20, unit: "%", max_change_percent: 100 } },
    vn_pmi: { id: "vn_pmi", name: "Chỉ số PMI", type: "aggregate", frequency: "monthly", priority: 1, parser: "pmi", validation: { min: 30, max: 70, unit: "Điểm", max_change_percent: 30 } },
    
    // THÊM MỚI: Tiện ích sinh hoạt
    vn_gas_lpg: { id: "vn_gas_lpg", name: "Gas LPG (12kg)", type: "official", frequency: "monthly", priority: 2, parser: "utilities_gas", validation: { min: 300000, max: 700000, unit: "VNĐ/bình", max_change_percent: 15 } },
    vn_electricity: { id: "vn_electricity", name: "Giá điện (Bình quân)", type: "official", frequency: "monthly", priority: 2, parser: "utilities_elec", validation: { min: 1500, max: 3500, unit: "VNĐ/kWh", max_change_percent: 10 } },
    vn_water: { id: "vn_water", name: "Giá nước (Bậc 1)", type: "official", frequency: "monthly", priority: 2, parser: "utilities_water", validation: { min: 5000, max: 15000, unit: "VNĐ/m³", max_change_percent: 10 } },
    
    // THÊM MỚI: Thu nhập & Tài chính
    vn_min_wage: { id: "vn_min_wage", name: "Lương tối thiểu (Vùng 1)", type: "official", frequency: "monthly", priority: 1, parser: "income_wage", validation: { min: 4000000, max: 8000000, unit: "VNĐ/tháng", max_change_percent: 15 } },
    vn_mortgage_rate: { id: "vn_mortgage_rate", name: "Lãi vay BĐS (VCB)", type: "official", frequency: "monthly", priority: 1, parser: "income_mortgage", validation: { min: 4, max: 15, unit: "%/năm", max_change_percent: 20 } }
};

module.exports = { MARKET_SOURCES };

// FILE: script_bot/config/market_symbols.js
module.exports = {
    SYMBOLS: [
        // ==========================================
        // 1. CHI PHÍ SINH HOẠT (Túi tiền người dân)
        // ==========================================
        { id: 'CPI_VN', name: 'Lạm phát (CPI)', type: 'macro', region: 'vn', api_source: 'macro_vnd', api_symbol: 'CPI_YOY', category: '💰 Chi phí sinh hoạt', unit: '%', official_source: 'Tổng cục Thống kê' },
        { id: 'RON95', name: 'Xăng RON 95-III', type: 'energy', region: 'vn', api_source: 'local', api_symbol: 'RON95', category: '💰 Chi phí sinh hoạt', unit: 'VNĐ/L', official_source: 'Petrolimex' },
        { id: 'GOLD_SJC', name: 'Vàng miếng SJC', type: 'metal', region: 'vn', api_source: 'local', api_symbol: 'GOLD_SJC', category: '💰 Chi phí sinh hoạt', unit: 'Tr/lượng', official_source: 'SJC' },
        { id: 'RICE_VN', name: 'Gạo xuất khẩu VN', type: 'agriculture', region: 'vn', api_source: 'static', api_symbol: 'RICE_VN', base_price: 512, category: '💰 Chi phí sinh hoạt', unit: 'USD/tấn', official_source: 'Giá tham chiếu (VFA)' },
        
        // ==========================================
        // 2. TIỀN TỆ
        // ==========================================
        { id: 'USD_VND', name: 'Tỷ giá USD/VND', type: 'currency', region: 'vn', api_source: 'yahoo', api_symbol: 'VND=X', category: '🏦 Tiền tệ', unit: 'VND', official_source: 'Ngân hàng Nhà nước' },
        { id: 'DXY', name: 'Chỉ số USD (DXY)', type: 'currency', region: 'global', api_source: 'yahoo', api_symbol: 'DX-Y.NYB', category: '🏦 Tiền tệ', unit: 'Điểm', official_source: 'Yahoo Finance' },
        { id: 'INTERBANK_RATE', name: 'Lãi suất LNH', type: 'macro', region: 'vn', api_source: 'macro_vnd', api_symbol: 'INTERBANK_ON', category: '🏦 Tiền tệ', unit: '%/năm', official_source: 'Ngân hàng Nhà nước' },

        // ==========================================
        // 3. VIỆC LÀM
        // ==========================================
        { id: 'UNEMP_VN', name: 'Tỷ lệ thất nghiệp', type: 'macro', region: 'vn', api_source: 'macro_vnd', api_symbol: 'UNEMPLOYMENT', category: '💼 Việc làm', unit: '%', official_source: 'Tổng cục Thống kê' },

        // ==========================================
        // 4. SẢN XUẤT
        // ==========================================
        { id: 'PMI_VN', name: 'Chỉ số PMI', type: 'macro', region: 'vn', api_source: 'macro_vnd', api_symbol: 'PMI', category: '🏭 Sản xuất', unit: 'Điểm', official_source: 'S&P Global' },
        { id: 'IIP_VN', name: 'Sản lượng CN (IIP)', type: 'macro', region: 'vn', api_source: 'macro_vnd', api_symbol: 'IIP_YOY', category: '🏭 Sản xuất', unit: '%', official_source: 'Tổng cục Thống kê' },

        // ==========================================
        // 5. THƯƠNG MẠI
        // ==========================================
        { id: 'EXPORT_VN', name: 'Xuất khẩu', type: 'macro', region: 'vn', api_source: 'macro_vnd', api_symbol: 'EXPORT_YOY', category: '🚢 Thương mại', unit: '% (YoY)', official_source: 'Tổng cục Hải quan' },
        { id: 'IMPORT_VN', name: 'Nhập khẩu', type: 'macro', region: 'vn', api_source: 'macro_vnd', api_symbol: 'IMPORT_YOY', category: '🚢 Thương mại', unit: '% (YoY)', official_source: 'Tổng cục Hải quan' },

        // ==========================================
        // 6. BẤT ĐỘNG SẢN & XÂY DỰNG
        // ==========================================
        { id: 'STEEL_CB300', name: 'Thép CB300', type: 'metal', region: 'vn', api_source: 'static', api_symbol: 'STEEL_CB300', base_price: 14.2, category: '🏗 Bất động sản & Xây dựng', unit: 'Tr/tấn', official_source: 'Giá tham chiếu' },
        { id: 'CEMENT', name: 'Xi măng', type: 'metal', region: 'vn', api_source: 'static', api_symbol: 'CEMENT', base_price: 1.5, category: '🏗 Bất động sản & Xây dựng', unit: 'Tr/tấn', official_source: 'Giá tham chiếu' },
        { id: 'SAND', name: 'Cát xây dựng', type: 'metal', region: 'vn', api_source: 'static', api_symbol: 'SAND', base_price: 450, category: '🏗 Bất động sản & Xây dựng', unit: 'Ngàn/m3', official_source: 'Giá tham chiếu' },

        // ==========================================
        // 7. HÀNG HÓA
        // ==========================================
        { id: 'BRENT', name: 'Dầu Brent', type: 'energy', region: 'global', api_source: 'yahoo', api_symbol: 'BZ=F', category: '🌾 Hàng hóa', unit: 'USD/thùng', official_source: 'Yahoo Finance' },
        { id: 'GOLD_W', name: 'Vàng Thế giới', type: 'metal', region: 'global', api_source: 'yahoo', api_symbol: 'GC=F', category: '🌾 Hàng hóa', unit: 'USD/oz', official_source: 'Yahoo Finance' },
        { id: 'COFFEE_VN', name: 'Cà phê Robusta', type: 'agriculture', region: 'vn', api_source: 'local', api_symbol: 'COFFEE_VN', category: '🌾 Hàng hóa', unit: 'VNĐ/kg', official_source: 'GiaCaPhe' },
        { id: 'PEPPER_VN', name: 'Hồ tiêu', type: 'agriculture', region: 'vn', api_source: 'local', api_symbol: 'PEPPER_VN', category: '🌾 Hàng hóa', unit: 'VNĐ/kg', official_source: 'GiaTieu' },

        // ==========================================
        // 8. THỊ TRƯỜNG TÀI CHÍNH
        // ==========================================
        { id: 'VNINDEX', name: 'VN-Index', type: 'stock', region: 'vn', api_source: 'vndirect_index', api_symbol: 'VNINDEX', category: '📈 Thị trường tài chính', unit: 'Điểm', official_source: 'HOSE' },
        { id: 'HNX', name: 'HNX-Index', type: 'stock', region: 'vn', api_source: 'vndirect_index', api_symbol: 'HNX', category: '📈 Thị trường tài chính', unit: 'Điểm', official_source: 'HNX' },
        { id: 'SP500', name: 'S&P 500', type: 'stock', region: 'global', api_source: 'yahoo', api_symbol: '^GSPC', category: '📈 Thị trường tài chính', unit: 'Điểm', official_source: 'Yahoo Finance' },
        { id: 'BTC', name: 'Bitcoin', type: 'crypto', region: 'global', api_source: 'coingecko', api_symbol: 'bitcoin', category: '📈 Thị trường tài chính', unit: 'USD', official_source: 'CoinGecko' }
    ]
};

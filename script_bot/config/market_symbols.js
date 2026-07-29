// FILE: script_bot/config/market_symbols.js
module.exports = {
    SYMBOLS: [
        // ==========================================
        // 1. TỶ GIÁ & TIỀN TỆ (Yahoo Finance)
        // ==========================================
        { id: 'USD_VND', name: 'USD / VND', type: 'currency', region: 'vn', api_source: 'yahoo', api_symbol: 'VND=X', category: '💱 Tỷ giá & Tiền tệ', unit: 'VND', official_source: 'Yahoo Finance' },
        { id: 'EUR_VND', name: 'EUR / VND', type: 'currency', region: 'vn', api_source: 'yahoo', api_symbol: 'EURVND=X', category: '💱 Tỷ giá & Tiền tệ', unit: 'VND', official_source: 'Yahoo Finance' },
        { id: 'CNY_VND', name: 'CNY / VND', type: 'currency', region: 'vn', api_source: 'yahoo', api_symbol: 'CNYVND=X', category: '💱 Tỷ giá & Tiền tệ', unit: 'VND', official_source: 'Yahoo Finance' },
        { id: 'JPY_VND', name: 'JPY / VND', type: 'currency', region: 'vn', api_source: 'yahoo', api_symbol: 'JPYVND=X', category: '💱 Tỷ giá & Tiền tệ', unit: 'VND', official_source: 'Yahoo Finance' },
        
        { id: 'DXY', name: 'Chỉ số DXY', type: 'currency', region: 'global', api_source: 'yahoo', api_symbol: 'DX-Y.NYB', category: '💱 Tỷ giá & Tiền tệ', unit: 'Điểm', official_source: 'Yahoo Finance' },
        { id: 'EUR_USD', name: 'EUR / USD', type: 'currency', region: 'global', api_source: 'yahoo', api_symbol: 'EURUSD=X', category: '💱 Tỷ giá & Tiền tệ', unit: 'USD', official_source: 'Yahoo Finance' },
        { id: 'USD_CNY', name: 'USD / CNY', type: 'currency', region: 'global', api_source: 'yahoo', api_symbol: 'CNY=X', category: '💱 Tỷ giá & Tiền tệ', unit: 'CNY', official_source: 'Yahoo Finance' },
        { id: 'USD_JPY', name: 'USD / JPY', type: 'currency', region: 'global', api_source: 'yahoo', api_symbol: 'JPY=X', category: '💱 Tỷ giá & Tiền tệ', unit: 'JPY', official_source: 'Yahoo Finance' },
        { id: 'US10Y', name: 'US 10Y Yield', type: 'currency', region: 'global', api_source: 'yahoo', api_symbol: '^TNX', category: '💱 Tỷ giá & Tiền tệ', unit: '%', official_source: 'Yahoo Finance' },

        // ==========================================
        // 2. CHỨNG KHOÁN (Yahoo & Nguồn chuẩn)
        // ==========================================
        { id: 'VNINDEX', name: 'VN-Index', type: 'stock', region: 'vn', api_source: 'yahoo', api_symbol: '^VNINDEX', category: '📈 Chứng khoán', unit: 'Điểm', official_source: 'Yahoo Finance' },
        { id: 'HNX', name: 'HNX-Index', type: 'stock', region: 'vn', api_source: 'yahoo', api_symbol: '^HASTC', category: '📈 Chứng khoán', unit: 'Điểm', official_source: 'Yahoo Finance' },

        { id: 'SP500', name: 'S&P 500', type: 'stock', region: 'global', api_source: 'yahoo', api_symbol: '^GSPC', category: '📈 Chứng khoán', unit: 'Điểm', official_source: 'Yahoo Finance' },
        { id: 'NASDAQ', name: 'Nasdaq', type: 'stock', region: 'global', api_source: 'yahoo', api_symbol: '^IXIC', category: '📈 Chứng khoán', unit: 'Điểm', official_source: 'Yahoo Finance' },
        { id: 'NIKKEI', name: 'Nikkei 225', type: 'stock', region: 'global', api_source: 'yahoo', api_symbol: '^N225', category: '📈 Chứng khoán', unit: 'Điểm', official_source: 'Yahoo Finance' },
        { id: 'HANGSENG', name: 'Hang Seng', type: 'stock', region: 'global', api_source: 'yahoo', api_symbol: '^HSI', category: '📈 Chứng khoán', unit: 'Điểm', official_source: 'Yahoo Finance' },
        { id: 'SHANGHAI', name: 'Shanghai Comp', type: 'stock', region: 'global', api_source: 'yahoo', api_symbol: '000001.SS', category: '📈 Chứng khoán', unit: 'Điểm', official_source: 'Yahoo Finance' },

        // ==========================================
        // 3. KIM LOẠI, VÀNG & NĂNG LƯỢNG 
        // ==========================================
        { id: 'GOLD_SJC', name: 'Vàng miếng SJC', type: 'metal', region: 'vn', api_source: 'local', api_symbol: 'GOLD_SJC', category: '🥇 Kim loại & Vàng', unit: 'Tr/lượng', official_source: 'SJC' },
        { id: 'RON95', name: 'Xăng RON 95-III', type: 'energy', region: 'vn', api_source: 'local', api_symbol: 'RON95', category: '⛽ Năng lượng', unit: 'VNĐ/L', official_source: 'Petrolimex' },

        { id: 'GOLD_W', name: 'Vàng Thế giới', type: 'metal', region: 'global', api_source: 'yahoo', api_symbol: 'GC=F', category: '🥇 Kim loại & Vàng', unit: 'USD/oz', official_source: 'Yahoo Finance' },
        { id: 'SILVER', name: 'Bạc', type: 'metal', region: 'global', api_source: 'yahoo', api_symbol: 'SI=F', category: '🥇 Kim loại & Vàng', unit: 'USD/oz', official_source: 'Yahoo Finance' },
        { id: 'COPPER', name: 'Đồng', type: 'metal', region: 'global', api_source: 'yahoo', api_symbol: 'HG=F', category: '🥇 Kim loại & Vàng', unit: 'USD/lb', official_source: 'Yahoo Finance' },
        { id: 'BRENT', name: 'Dầu Brent', type: 'energy', region: 'global', api_source: 'yahoo', api_symbol: 'BZ=F', category: '⛽ Năng lượng', unit: 'USD/thùng', official_source: 'Yahoo Finance' },
        { id: 'WTI', name: 'Dầu WTI', type: 'energy', region: 'global', api_source: 'yahoo', api_symbol: 'CL=F', category: '⛽ Năng lượng', unit: 'USD/thùng', official_source: 'Yahoo Finance' },
        { id: 'NAT_GAS', name: 'Khí tự nhiên', type: 'energy', region: 'global', api_source: 'yahoo', api_symbol: 'NG=F', category: '⛽ Năng lượng', unit: 'USD/MMBtu', official_source: 'Yahoo Finance' },

        // ==========================================
        // 4. NÔNG SẢN & VẬT LIỆU
        // ==========================================
        { id: 'COFFEE_VN', name: 'Cà phê Robusta', type: 'agriculture', region: 'vn', api_source: 'local', api_symbol: 'COFFEE_VN', category: '🌾 Nông sản', unit: 'VNĐ/kg', official_source: 'GiaCaPhe' },
        { id: 'PEPPER_VN', name: 'Hồ tiêu', type: 'agriculture', region: 'vn', api_source: 'local', api_symbol: 'PEPPER_VN', category: '🌾 Nông sản', unit: 'VNĐ/kg', official_source: 'GiaTieu' },

        { id: 'WHEAT', name: 'Lúa mì', type: 'agriculture', region: 'global', api_source: 'yahoo', api_symbol: 'ZW=F', category: '🌾 Nông sản', unit: 'USc/bu', official_source: 'Yahoo Finance' },
        { id: 'CORN', name: 'Ngô', type: 'agriculture', region: 'global', api_source: 'yahoo', api_symbol: 'ZC=F', category: '🌾 Nông sản', unit: 'USc/bu', official_source: 'Yahoo Finance' },
        { id: 'SOYBEAN', name: 'Đậu tương', type: 'agriculture', region: 'global', api_source: 'yahoo', api_symbol: 'ZS=F', category: '🌾 Nông sản', unit: 'USc/bu', official_source: 'Yahoo Finance' },
        
        { id: 'ALUMINUM', name: 'Nhôm', type: 'metal', region: 'global', api_source: 'yahoo', api_symbol: 'ALI=F', category: '🏗️ Vật liệu', unit: 'USD/tấn', official_source: 'Yahoo Finance' },

        // ==========================================
        // 5. TIỀN ĐIỆN TỬ
        // ==========================================
        { id: 'BTC', name: 'Bitcoin', type: 'crypto', region: 'global', api_source: 'coingecko', api_symbol: 'bitcoin', category: '🪙 Tiền điện tử', unit: 'USD', official_source: 'CoinGecko' },
        { id: 'ETH', name: 'Ethereum', type: 'crypto', region: 'global', api_source: 'coingecko', api_symbol: 'ethereum', category: '🪙 Tiền điện tử', unit: 'USD', official_source: 'CoinGecko' }
    ]
};

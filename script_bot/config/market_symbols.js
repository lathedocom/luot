// FILE: script_bot/config/market_symbols.js
module.exports = {
    SYMBOLS: [
        // ==========================================
        // 1. TÚI TIỀN NGƯỜI DÂN (Ưu tiên số 1)
        // ==========================================
        { id: 'USD_VND', name: 'USD / VND', type: 'currency', region: 'vn', api_source: 'yahoo', api_symbol: 'VND=X', category: '🛒 Túi tiền người dân', unit: 'VND', official_source: 'Yahoo Finance' },
        { id: 'GOLD_SJC', name: 'Vàng miếng SJC', type: 'metal', region: 'vn', api_source: 'local', api_symbol: 'GOLD_SJC', category: '🛒 Túi tiền người dân', unit: 'Tr/lượng', official_source: 'SJC' },
        { id: 'RON95', name: 'Xăng RON 95-III', type: 'energy', region: 'vn', api_source: 'local', api_symbol: 'RON95', category: '🛒 Túi tiền người dân', unit: 'VNĐ/L', official_source: 'Petrolimex' },
        { id: 'COFFEE_VN', name: 'Cà phê Robusta', type: 'agriculture', region: 'vn', api_source: 'local', api_symbol: 'COFFEE_VN', category: '🛒 Túi tiền người dân', unit: 'VNĐ/kg', official_source: 'GiaCaPhe' },
        { id: 'PEPPER_VN', name: 'Hồ tiêu', type: 'agriculture', region: 'vn', api_source: 'local', api_symbol: 'PEPPER_VN', category: '🛒 Túi tiền người dân', unit: 'VNĐ/kg', official_source: 'GiaTieu' },

        // ==========================================
        // 2. KINH TẾ VIỆT NAM
        // ==========================================
        { id: 'VNINDEX', name: 'VN-Index', type: 'stock', region: 'vn', api_source: 'local', api_symbol: 'VNINDEX', category: '🇻🇳 Kinh tế Việt Nam', unit: 'Điểm', official_source: 'HOSE' },
        { id: 'HNX', name: 'HNX-Index', type: 'stock', region: 'vn', api_source: 'local', api_symbol: 'HNX', category: '🇻🇳 Kinh tế Việt Nam', unit: 'Điểm', official_source: 'HNX' },

        // ==========================================
        // 3. THỊ TRƯỜNG THẾ GIỚI
        // ==========================================
        { id: 'SP500', name: 'S&P 500', type: 'stock', region: 'global', api_source: 'yahoo', api_symbol: '^GSPC', category: '🌍 Kinh tế Thế giới', unit: 'Điểm', official_source: 'Yahoo Finance' },
        { id: 'NASDAQ', name: 'Nasdaq', type: 'stock', region: 'global', api_source: 'yahoo', api_symbol: '^IXIC', category: '🌍 Kinh tế Thế giới', unit: 'Điểm', official_source: 'Yahoo Finance' },
        { id: 'NIKKEI', name: 'Nikkei 225', type: 'stock', region: 'global', api_source: 'yahoo', api_symbol: '^N225', category: '🌍 Kinh tế Thế giới', unit: 'Điểm', official_source: 'Yahoo Finance' },
        { id: 'SHANGHAI', name: 'Shanghai Comp', type: 'stock', region: 'global', api_source: 'yahoo', api_symbol: '000001.SS', category: '🌍 Kinh tế Thế giới', unit: 'Điểm', official_source: 'Yahoo Finance' },

        // ==========================================
        // 4. NGUYÊN LIỆU & NĂNG LƯỢNG
        // ==========================================
        { id: 'GOLD_W', name: 'Vàng Thế giới', type: 'metal', region: 'global', api_source: 'yahoo', api_symbol: 'GC=F', category: '🔥 Nguyên liệu & Năng lượng', unit: 'USD/oz', official_source: 'Yahoo Finance' },
        { id: 'BRENT', name: 'Dầu Brent', type: 'energy', region: 'global', api_source: 'yahoo', api_symbol: 'BZ=F', category: '🔥 Nguyên liệu & Năng lượng', unit: 'USD/thùng', official_source: 'Yahoo Finance' },
        { id: 'WTI', name: 'Dầu WTI', type: 'energy', region: 'global', api_source: 'yahoo', api_symbol: 'CL=F', category: '🔥 Nguyên liệu & Năng lượng', unit: 'USD/thùng', official_source: 'Yahoo Finance' },
        { id: 'COPPER', name: 'Đồng', type: 'metal', region: 'global', api_source: 'yahoo', api_symbol: 'HG=F', category: '🔥 Nguyên liệu & Năng lượng', unit: 'USD/lb', official_source: 'Yahoo Finance' },
        { id: 'NAT_GAS', name: 'Khí tự nhiên', type: 'energy', region: 'global', api_source: 'yahoo', api_symbol: 'NG=F', category: '🔥 Nguyên liệu & Năng lượng', unit: 'USD/MMBtu', official_source: 'Yahoo Finance' },

        // ==========================================
        // 5. NÔNG SẢN QUỐC TẾ
        // ==========================================
        { id: 'WHEAT', name: 'Lúa mì', type: 'agriculture', region: 'global', api_source: 'yahoo', api_symbol: 'ZW=F', category: '🌾 Nông sản Quốc tế', unit: 'USc/bu', official_source: 'Yahoo Finance' },
        { id: 'CORN', name: 'Ngô', type: 'agriculture', region: 'global', api_source: 'yahoo', api_symbol: 'ZC=F', category: '🌾 Nông sản Quốc tế', unit: 'USc/bu', official_source: 'Yahoo Finance' },
        { id: 'SOYBEAN', name: 'Đậu tương', type: 'agriculture', region: 'global', api_source: 'yahoo', api_symbol: 'ZS=F', category: '🌾 Nông sản Quốc tế', unit: 'USc/bu', official_source: 'Yahoo Finance' },

        // ==========================================
        // 6. TIỀN ĐIỆN TỬ
        // ==========================================
        { id: 'BTC', name: 'Bitcoin', type: 'crypto', region: 'global', api_source: 'coingecko', api_symbol: 'bitcoin', category: '🪙 Tiền điện tử', unit: 'USD', official_source: 'CoinGecko' },
        { id: 'ETH', name: 'Ethereum', type: 'crypto', region: 'global', api_source: 'coingecko', api_symbol: 'ethereum', category: '🪙 Tiền điện tử', unit: 'USD', official_source: 'CoinGecko' },
        { id: 'SOL', name: 'Solana', type: 'crypto', region: 'global', api_source: 'coingecko', api_symbol: 'solana', category: '🪙 Tiền điện tử', unit: 'USD', official_source: 'CoinGecko' }
    ]
};

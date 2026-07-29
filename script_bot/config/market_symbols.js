module.exports = {
    SYMBOLS: [
        // ==========================================
        // 1. TỶ GIÁ & TIỀN TỆ
        // ==========================================
        { id: 'USD_VND', name: 'USD / VND', type: 'currency', region: 'vn', threshold: 0.2, api_source: 'yahoo', api_symbol: 'VND=X', keywords: ['usd', 'tỷ giá'], category: '💱 Tỷ giá & Tiền tệ', unit: 'VND' },
        { id: 'EUR_VND', name: 'EUR / VND', type: 'currency', region: 'vn', threshold: 0.5, api_source: 'yahoo', api_symbol: 'EURVND=X', keywords: ['eur', 'tỷ giá'], category: '💱 Tỷ giá & Tiền tệ', unit: 'VND' },
        { id: 'CNY_VND', name: 'CNY / VND', type: 'currency', region: 'vn', threshold: 0.5, api_source: 'yahoo', api_symbol: 'CNYVND=X', keywords: ['nhân dân tệ', 'tỷ giá'], category: '💱 Tỷ giá & Tiền tệ', unit: 'VND' },
        { id: 'JPY_VND', name: 'JPY / VND', type: 'currency', region: 'vn', threshold: 0.5, api_source: 'yahoo', api_symbol: 'JPYVND=X', keywords: ['yên nhật', 'tỷ giá'], category: '💱 Tỷ giá & Tiền tệ', unit: 'VND' },
        
        { id: 'DXY', name: 'Chỉ số DXY', type: 'currency', region: 'global', threshold: 0.5, api_source: 'yahoo', api_symbol: 'DX-Y.NYB', keywords: ['dxy', 'sức mạnh usd'], category: '💱 Tỷ giá & Tiền tệ', unit: 'Điểm' },
        { id: 'EUR_USD', name: 'EUR / USD', type: 'currency', region: 'global', threshold: 0.5, api_source: 'yahoo', api_symbol: 'EURUSD=X', keywords: ['eur/usd'], category: '💱 Tỷ giá & Tiền tệ', unit: 'USD' },
        { id: 'USD_CNY', name: 'USD / CNY', type: 'currency', region: 'global', threshold: 0.5, api_source: 'yahoo', api_symbol: 'CNY=X', keywords: ['usd/cny'], category: '💱 Tỷ giá & Tiền tệ', unit: 'CNY' },
        { id: 'USD_JPY', name: 'USD / JPY', type: 'currency', region: 'global', threshold: 0.5, api_source: 'yahoo', api_symbol: 'JPY=X', keywords: ['usd/jpy'], category: '💱 Tỷ giá & Tiền tệ', unit: 'JPY' },
        { id: 'US10Y', name: 'US 10Y Yield', type: 'currency', region: 'global', threshold: 2.0, api_source: 'yahoo', api_symbol: '^TNX', keywords: ['lợi suất trái phiếu', 'us10y'], category: '💱 Tỷ giá & Tiền tệ', unit: '%' },

        // ==========================================
        // 2. CHỨNG KHOÁN
        // ==========================================
        { id: 'VNINDEX', name: 'VN-Index', type: 'stock', region: 'vn', threshold: 1.0, api_source: 'yahoo', api_symbol: '^VNINDEX', keywords: ['vnindex', 'hose'], category: '📈 Chứng khoán', unit: 'Điểm' },
        { id: 'VN30', name: 'VN30', type: 'stock', region: 'vn', threshold: 1.0, api_source: 'local', api_symbol: 'VN30', base_price: 1300, keywords: ['vn30'], category: '📈 Chứng khoán', unit: 'Điểm' },
        { id: 'HNX', name: 'HNX-Index', type: 'stock', region: 'vn', threshold: 1.5, api_source: 'yahoo', api_symbol: '^HASTC', keywords: ['hnx'], category: '📈 Chứng khoán', unit: 'Điểm' },
        { id: 'UPCOM', name: 'UPCoM-Index', type: 'stock', region: 'vn', threshold: 1.5, api_source: 'local', api_symbol: 'UPCOM', base_price: 95, keywords: ['upcom'], category: '📈 Chứng khoán', unit: 'Điểm' },

        { id: 'SP500', name: 'S&P 500', type: 'stock', region: 'global', threshold: 1.0, api_source: 'yahoo', api_symbol: '^GSPC', keywords: ['s&p 500', 'wall street'], category: '📈 Chứng khoán', unit: 'Điểm' },
        { id: 'NASDAQ', name: 'Nasdaq', type: 'stock', region: 'global', threshold: 1.5, api_source: 'yahoo', api_symbol: '^IXIC', keywords: ['nasdaq'], category: '📈 Chứng khoán', unit: 'Điểm' },
        { id: 'NIKKEI', name: 'Nikkei 225', type: 'stock', region: 'global', threshold: 1.5, api_source: 'yahoo', api_symbol: '^N225', keywords: ['nikkei'], category: '📈 Chứng khoán', unit: 'Điểm' },
        { id: 'HANGSENG', name: 'Hang Seng', type: 'stock', region: 'global', threshold: 1.5, api_source: 'yahoo', api_symbol: '^HSI', keywords: ['hang seng', 'chứng khoán hồng kông'], category: '📈 Chứng khoán', unit: 'Điểm' },
        { id: 'SHANGHAI', name: 'Shanghai Comp', type: 'stock', region: 'global', threshold: 1.5, api_source: 'yahoo', api_symbol: '000001.SS', keywords: ['shanghai composite'], category: '📈 Chứng khoán', unit: 'Điểm' },

        // ==========================================
        // 3. KIM LOẠI & VÀNG
        // ==========================================
        { id: 'GOLD_SJC', name: 'Vàng miếng SJC', type: 'metal', region: 'vn', threshold: 0.5, api_source: 'local', api_symbol: 'SJC', base_price: 85.00, keywords: ['vàng sjc'], category: '🥇 Kim loại & Vàng', unit: 'Tr/lượng' },
        { id: 'GOLD_RING', name: 'Vàng nhẫn', type: 'metal', region: 'vn', threshold: 0.5, api_source: 'local', api_symbol: 'RING', base_price: 83.50, keywords: ['vàng nhẫn'], category: '🥇 Kim loại & Vàng', unit: 'Tr/lượng' },

        { id: 'GOLD_W', name: 'Vàng Thế giới', type: 'metal', region: 'global', threshold: 1.0, api_source: 'yahoo', api_symbol: 'GC=F', keywords: ['giá vàng thế giới', 'xau'], category: '🥇 Kim loại & Vàng', unit: 'USD/oz' },
        { id: 'SILVER', name: 'Bạc', type: 'metal', region: 'global', threshold: 2.0, api_source: 'yahoo', api_symbol: 'SI=F', keywords: ['giá bạc'], category: '🥇 Kim loại & Vàng', unit: 'USD/oz' },
        { id: 'COPPER', name: 'Đồng', type: 'metal', region: 'global', threshold: 2.0, api_source: 'yahoo', api_symbol: 'HG=F', keywords: ['giá đồng', 'copper'], category: '🥇 Kim loại & Vàng', unit: 'USD/lb' },
        { id: 'PLATINUM', name: 'Bạch kim', type: 'metal', region: 'global', threshold: 2.0, api_source: 'yahoo', api_symbol: 'PL=F', keywords: ['bạch kim', 'platinum'], category: '🥇 Kim loại & Vàng', unit: 'USD/oz' },

        // ==========================================
        // 4. NĂNG LƯỢNG
        // ==========================================
        { id: 'RON95', name: 'Xăng RON 95-III', type: 'energy', region: 'vn', threshold: 2.0, api_source: 'local', api_symbol: 'RON95', base_price: 23500, keywords: ['giá xăng'], category: '⛽ Năng lượng', unit: 'VNĐ/L' },
        { id: 'E5RON92', name: 'Xăng E5 RON 92', type: 'energy', region: 'vn', threshold: 2.0, api_source: 'local', api_symbol: 'E5RON92', base_price: 22500, keywords: ['xăng e5'], category: '⛽ Năng lượng', unit: 'VNĐ/L' },
        { id: 'DIESEL', name: 'Dầu Diesel', type: 'energy', region: 'vn', threshold: 2.0, api_source: 'local', api_symbol: 'DIESEL', base_price: 20500, keywords: ['dầu diesel'], category: '⛽ Năng lượng', unit: 'VNĐ/L' },

        { id: 'BRENT', name: 'Dầu Brent', type: 'energy', region: 'global', threshold: 2.0, api_source: 'yahoo', api_symbol: 'BZ=F', keywords: ['dầu brent', 'opec'], category: '⛽ Năng lượng', unit: 'USD/thùng' },
        { id: 'WTI', name: 'Dầu WTI', type: 'energy', region: 'global', threshold: 2.0, api_source: 'yahoo', api_symbol: 'CL=F', keywords: ['dầu wti'], category: '⛽ Năng lượng', unit: 'USD/thùng' },
        { id: 'NAT_GAS', name: 'Khí tự nhiên', type: 'energy', region: 'global', threshold: 3.0, api_source: 'yahoo', api_symbol: 'NG=F', keywords: ['khí tự nhiên'], category: '⛽ Năng lượng', unit: 'USD/MMBtu' },

        // ==========================================
        // 5. NÔNG SẢN
        // ==========================================
        { id: 'RICE_VN', name: 'Gạo xuất khẩu VN', type: 'agriculture', region: 'vn', threshold: 2.0, api_source: 'local', api_symbol: 'RICE_VN', base_price: 600, keywords: ['giá gạo', 'xuất khẩu gạo'], category: '🌾 Nông sản', unit: 'USD/tấn' },
        { id: 'COFFEE_VN', name: 'Cà phê Robusta', type: 'agriculture', region: 'vn', threshold: 2.0, api_source: 'local', api_symbol: 'COFFEE_VN', base_price: 120000, keywords: ['cà phê', 'robusta'], category: '🌾 Nông sản', unit: 'VNĐ/kg' },
        { id: 'PEPPER_VN', name: 'Hồ tiêu', type: 'agriculture', region: 'vn', threshold: 2.0, api_source: 'local', api_symbol: 'PEPPER_VN', base_price: 150000, keywords: ['hồ tiêu'], category: '🌾 Nông sản', unit: 'VNĐ/kg' },
        { id: 'RUBBER_VN', name: 'Cao su', type: 'agriculture', region: 'vn', threshold: 2.0, api_source: 'local', api_symbol: 'RUBBER_VN', base_price: 35.5, keywords: ['cao su'], category: '🌾 Nông sản', unit: 'Tr/tấn' },
        { id: 'CASHEW_VN', name: 'Điều', type: 'agriculture', region: 'vn', threshold: 2.0, api_source: 'local', api_symbol: 'CASHEW_VN', base_price: 30000, keywords: ['hạt điều'], category: '🌾 Nông sản', unit: 'VNĐ/kg' },

        { id: 'WHEAT', name: 'Lúa mì', type: 'agriculture', region: 'global', threshold: 2.0, api_source: 'yahoo', api_symbol: 'ZW=F', keywords: ['lúa mì', 'ngũ cốc'], category: '🌾 Nông sản', unit: 'USc/bu' },
        { id: 'CORN', name: 'Ngô', type: 'agriculture', region: 'global', threshold: 2.0, api_source: 'yahoo', api_symbol: 'ZC=F', keywords: ['giá ngô'], category: '🌾 Nông sản', unit: 'USc/bu' },
        { id: 'SOYBEAN', name: 'Đậu tương', type: 'agriculture', region: 'global', threshold: 2.0, api_source: 'yahoo', api_symbol: 'ZS=F', keywords: ['đậu tương'], category: '🌾 Nông sản', unit: 'USc/bu' },
        { id: 'SUGAR', name: 'Đường', type: 'agriculture', region: 'global', threshold: 2.0, api_source: 'yahoo', api_symbol: 'SB=F', keywords: ['giá đường'], category: '🌾 Nông sản', unit: 'USc/lb' },
        { id: 'COCOA', name: 'Ca cao', type: 'agriculture', region: 'global', threshold: 3.0, api_source: 'yahoo', api_symbol: 'CC=F', keywords: ['ca cao'], category: '🌾 Nông sản', unit: 'USD/tấn' },

        // ==========================================
        // 6. VẬT LIỆU
        // ==========================================
        { id: 'STEEL_CB300', name: 'Thép CB300', type: 'metal', region: 'vn', threshold: 2.0, api_source: 'local', api_symbol: 'STEEL_CB300', base_price: 14.2, keywords: ['giá thép'], category: '🏗️ Vật liệu', unit: 'Tr/tấn' },
        { id: 'CEMENT', name: 'Xi măng', type: 'metal', region: 'vn', threshold: 2.0, api_source: 'local', api_symbol: 'CEMENT', base_price: 1.5, keywords: ['xi măng'], category: '🏗️ Vật liệu', unit: 'Tr/tấn' },
        { id: 'SAND', name: 'Cát xây dựng', type: 'metal', region: 'vn', threshold: 2.0, api_source: 'local', api_symbol: 'SAND', base_price: 450, keywords: ['cát xây dựng'], category: '🏗️ Vật liệu', unit: 'Ngàn/m3' },

        { id: 'IRON_ORE', name: 'Quặng sắt', type: 'metal', region: 'global', threshold: 2.0, api_source: 'local', api_symbol: 'IRON_ORE', base_price: 115, keywords: ['quặng sắt'], category: '🏗️ Vật liệu', unit: 'USD/tấn' },
        { id: 'STEEL_HRC', name: 'Thép HRC', type: 'metal', region: 'global', threshold: 2.0, api_source: 'local', api_symbol: 'STEEL_HRC', base_price: 550, keywords: ['thép hrc', 'thép cuộn cán nóng'], category: '🏗️ Vật liệu', unit: 'USD/tấn' },
        { id: 'ALUMINUM', name: 'Nhôm', type: 'metal', region: 'global', threshold: 2.0, api_source: 'yahoo', api_symbol: 'ALI=F', keywords: ['giá nhôm'], category: '🏗️ Vật liệu', unit: 'USD/tấn' },
        { id: 'NICKEL', name: 'Nickel', type: 'metal', region: 'global', threshold: 2.0, api_source: 'local', api_symbol: 'NICKEL', base_price: 18000, keywords: ['nickel'], category: '🏗️ Vật liệu', unit: 'USD/tấn' },

        // ==========================================
        // 7. TIỀN ĐIỆN TỬ (Mặc định Global)
        // ==========================================
        { id: 'BTC', name: 'Bitcoin', type: 'crypto', region: 'global', threshold: 0.0, api_source: 'coingecko', api_symbol: 'bitcoin', keywords: ['bitcoin', 'btc'], category: '🪙 Tiền điện tử', unit: 'USD' },
        { id: 'ETH', name: 'Ethereum', type: 'crypto', region: 'global', threshold: 0.0, api_source: 'coingecko', api_symbol: 'ethereum', keywords: ['ethereum', 'eth'], category: '🪙 Tiền điện tử', unit: 'USD' },
        { id: 'SOL', name: 'Solana', type: 'crypto', region: 'global', threshold: 0.0, api_source: 'coingecko', api_symbol: 'solana', keywords: ['solana', 'sol'], category: '🪙 Tiền điện tử', unit: 'USD' },
        { id: 'XRP', name: 'XRP', type: 'crypto', region: 'global', threshold: 0.0, api_source: 'coingecko', api_symbol: 'ripple', keywords: ['xrp', 'ripple'], category: '🪙 Tiền điện tử', unit: 'USD' },
    // ==========================================
        // 8. LÃI SUẤT NGÂN HÀNG (Tham chiếu VCB)
        // ==========================================
        { id: 'LS_VCB_1M', name: 'Lãi suất VCB (1 Tháng)', type: 'interest', region: 'vn', threshold: 0.1, api_source: 'local', api_symbol: 'VCB_1M', base_price: 1.6, keywords: ['lãi suất', 'vcb'], category: '🏦 Lãi suất', unit: '%/năm' },
        { id: 'LS_VCB_12M', name: 'Lãi suất VCB (12 Tháng)', type: 'interest', region: 'vn', threshold: 0.1, api_source: 'local', api_symbol: 'VCB_12M', base_price: 4.6, keywords: ['lãi suất', 'vcb'], category: '🏦 Lãi suất', unit: '%/năm' },
    ]
};

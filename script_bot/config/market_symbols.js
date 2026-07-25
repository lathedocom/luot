module.exports = {
    // TẦNG 1 & 2: Danh sách 25 chỉ số cốt lõi và ngưỡng cảnh báo
    SYMBOLS: [
        // --- TIỀN TỆ (Yahoo Finance) ---
        { id: 'USD_VND', name: 'USD/VND', type: 'currency', threshold: 0.5, api_source: 'yahoo', api_symbol: 'VND=X', keywords: ['usd', 'tỷ giá', 'ngân hàng nhà nước', 'ngoại tệ'], category: 'Tỷ giá & Tiền tệ', unit: 'VND' },
        { id: 'DXY', name: 'Dollar Index (DXY)', type: 'currency', threshold: 0.5, api_source: 'yahoo', api_symbol: 'DX-Y.NYB', keywords: ['dxy', 'đồng đô la', 'usd', 'fed'], category: 'Tỷ giá & Tiền tệ', unit: 'Điểm' },
        { id: 'EUR_USD', name: 'EUR/USD', type: 'currency', threshold: 0.5, api_source: 'yahoo', api_symbol: 'EURUSD=X', keywords: ['eur', 'euro', 'ecb'], category: 'Tỷ giá & Tiền tệ', unit: 'USD' },
        { id: 'USD_JPY', name: 'USD/JPY', type: 'currency', threshold: 0.5, api_source: 'yahoo', api_symbol: 'JPY=X', keywords: ['jpy', 'yên nhật', 'boj'], category: 'Tỷ giá & Tiền tệ', unit: 'JPY' },

        // --- KIM LOẠI QUÝ (Yahoo Finance) ---
        { id: 'GOLD_W', name: 'Vàng thế giới', type: 'metal', threshold: 1.0, api_source: 'yahoo', api_symbol: 'GC=F', keywords: ['vàng thế giới', 'gold', 'xau', 'fed'], category: 'Kim loại & Hàng hóa', unit: 'USD/oz' },
        { id: 'SILVER', name: 'Bạc', type: 'metal', threshold: 2.0, api_source: 'yahoo', api_symbol: 'SI=F', keywords: ['bạc', 'silver', 'kim loại'], category: 'Kim loại & Hàng hóa', unit: 'USD/oz' },
        
        // Kim loại địa phương (Cần crawl riêng sau, tạm để local)
        { id: 'GOLD_SJC', name: 'Vàng SJC', type: 'metal', threshold: 1.0, api_source: 'local', api_symbol: 'SJC', keywords: ['vàng sjc', 'giá vàng trong nước', 'vàng miếng'], category: 'Kim loại & Hàng hóa', unit: 'Triệu/lượng' },
        { id: 'GOLD_RING', name: 'Vàng nhẫn', type: 'metal', threshold: 1.0, api_source: 'local', api_symbol: 'RING', keywords: ['vàng nhẫn', 'vàng 9999'], category: 'Kim loại & Hàng hóa', unit: 'Triệu/lượng' },

        // --- NĂNG LƯỢNG (Yahoo Finance) ---
        { id: 'BRENT', name: 'Dầu Brent', type: 'energy', threshold: 2.0, api_source: 'yahoo', api_symbol: 'BZ=F', keywords: ['dầu brent', 'giá dầu', 'opec'], category: 'Năng lượng', unit: 'USD/thùng' },
        { id: 'WTI', name: 'Dầu WTI', type: 'energy', threshold: 2.0, api_source: 'yahoo', api_symbol: 'CL=F', keywords: ['dầu wti', 'dầu thô', 'opec'], category: 'Năng lượng', unit: 'USD/thùng' },
        { id: 'NAT_GAS', name: 'Khí tự nhiên', type: 'energy', threshold: 3.0, api_source: 'yahoo', api_symbol: 'NG=F', keywords: ['khí tự nhiên', 'lng', 'khí đốt'], category: 'Năng lượng', unit: 'USD/MMBtu' },
        
        // Năng lượng địa phương
        { id: 'GAS_VN', name: 'Xăng RON95', type: 'energy', threshold: 1.0, api_source: 'local', api_symbol: 'RON95', keywords: ['giá xăng', 'ron95', 'điều hành giá'], category: 'Năng lượng', unit: 'VNĐ/lít' },

        // --- CHỨNG KHOÁN (Yahoo Finance) ---
        { id: 'VNINDEX', name: 'VN-Index', type: 'stock', threshold: 1.5, api_source: 'yahoo', api_symbol: '^VNINDEX', keywords: ['vnindex', 'chứng khoán vn', 'hose', 'cổ phiếu'], category: 'Thị trường Chứng khoán', unit: 'Điểm' },
        { id: 'HNX', name: 'HNX-Index', type: 'stock', threshold: 1.5, api_source: 'yahoo', api_symbol: '^HASTC', keywords: ['hnx'], category: 'Thị trường Chứng khoán', unit: 'Điểm' },
        { id: 'SP500', name: 'S&P 500', type: 'stock', threshold: 1.5, api_source: 'yahoo', api_symbol: '^GSPC', keywords: ['s&p 500', 'chứng khoán mỹ', 'wall street'], category: 'Thị trường Chứng khoán', unit: 'Điểm' },
        { id: 'NASDAQ', name: 'Nasdaq', type: 'stock', threshold: 1.5, api_source: 'yahoo', api_symbol: '^IXIC', keywords: ['nasdaq', 'cổ phiếu công nghệ', 'big tech'], category: 'Thị trường Chứng khoán', unit: 'Điểm' },
        { id: 'DOW', name: 'Dow Jones', type: 'stock', threshold: 1.5, api_source: 'yahoo', api_symbol: '^DJI', keywords: ['dow jones', 'chứng khoán mỹ'], category: 'Thị trường Chứng khoán', unit: 'Điểm' },

        // --- TIỀN SỐ (Binance) ---
        { id: 'BTC', name: 'Bitcoin', type: 'crypto', threshold: 0.0, api_source: 'coingecko', api_symbol: 'bitcoin', keywords: ['bitcoin', 'btc', 'tiền ảo', 'tiền mã hóa'], category: 'Tiền điện tử', unit: 'USD' },
        { id: 'ETH', name: 'Ethereum', type: 'crypto', threshold: 0.0, api_source: 'coingecko', api_symbol: 'ethereum', keywords: ['ethereum', 'eth'], category: 'Tiền điện tử', unit: 'USD' },
        
        // --- NÔNG SẢN & LOGISTICS (Yahoo Finance) ---
        { id: 'COFFEE', name: 'Cà phê', type: 'agriculture', threshold: 2.0, api_source: 'yahoo', api_symbol: 'KC=F', keywords: ['cà phê', 'robusta', 'arabica', 'xuất khẩu nông sản'], category: 'Nông sản & Vật liệu', unit: 'USc/lb' },
        { id: 'RICE', name: 'Gạo', type: 'agriculture', threshold: 2.0, api_source: 'yahoo', api_symbol: 'ZR=F', keywords: ['gạo', 'xuất khẩu gạo', 'lương thực'], category: 'Nông sản & Vật liệu', unit: 'USD/cwt' },
        { id: 'COPPER', name: 'Đồng', type: 'metal', threshold: 2.0, api_source: 'yahoo', api_symbol: 'HG=F', keywords: ['đồng', 'copper', 'kim loại công nghiệp'], category: 'Nông sản & Vật liệu', unit: 'USD/lb' }
    ]
};

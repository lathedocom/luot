module.exports = {
    // TẦNG 1 & 2: Danh sách 25 chỉ số cốt lõi và ngưỡng cảnh báo
    SYMBOLS: [
        // --- TIỀN TỆ (Yahoo Finance) ---
        { id: 'USD_VND', name: 'USD/VND', type: 'currency', threshold: 0.5, api_source: 'yahoo', api_symbol: 'VND=X', keywords: ['usd', 'tỷ giá', 'ngân hàng nhà nước', 'ngoại tệ'] },
        { id: 'DXY', name: 'Dollar Index (DXY)', type: 'currency', threshold: 0.5, api_source: 'yahoo', api_symbol: 'DX-Y.NYB', keywords: ['dxy', 'đồng đô la', 'usd', 'fed'] },
        { id: 'EUR_USD', name: 'EUR/USD', type: 'currency', threshold: 0.5, api_source: 'yahoo', api_symbol: 'EURUSD=X', keywords: ['eur', 'euro', 'ecb'] },
        { id: 'USD_JPY', name: 'USD/JPY', type: 'currency', threshold: 0.5, api_source: 'yahoo', api_symbol: 'JPY=X', keywords: ['jpy', 'yên nhật', 'boj'] },

        // --- KIM LOẠI QUÝ (Yahoo Finance) ---
        { id: 'GOLD_W', name: 'Vàng thế giới', type: 'metal', threshold: 1.0, api_source: 'yahoo', api_symbol: 'GC=F', keywords: ['vàng thế giới', 'gold', 'xau', 'fed'] },
        { id: 'SILVER', name: 'Bạc', type: 'metal', threshold: 2.0, api_source: 'yahoo', api_symbol: 'SI=F', keywords: ['bạc', 'silver', 'kim loại'] },
        
        // Kim loại địa phương (Cần crawl riêng sau, tạm để local)
        { id: 'GOLD_SJC', name: 'Vàng SJC', type: 'metal', threshold: 1.0, api_source: 'local', api_symbol: 'SJC', keywords: ['vàng sjc', 'giá vàng trong nước', 'vàng miếng'] },
        { id: 'GOLD_RING', name: 'Vàng nhẫn', type: 'metal', threshold: 1.0, api_source: 'local', api_symbol: 'RING', keywords: ['vàng nhẫn', 'vàng 9999'] },

        // --- NĂNG LƯỢNG (Yahoo Finance) ---
        { id: 'BRENT', name: 'Dầu Brent', type: 'energy', threshold: 2.0, api_source: 'yahoo', api_symbol: 'BZ=F', keywords: ['dầu brent', 'giá dầu', 'opec'] },
        { id: 'WTI', name: 'Dầu WTI', type: 'energy', threshold: 2.0, api_source: 'yahoo', api_symbol: 'CL=F', keywords: ['dầu wti', 'dầu thô', 'opec'] },
        { id: 'NAT_GAS', name: 'Khí tự nhiên', type: 'energy', threshold: 3.0, api_source: 'yahoo', api_symbol: 'NG=F', keywords: ['khí tự nhiên', 'lng', 'khí đốt'] },
        
        // Năng lượng địa phương
        { id: 'GAS_VN', name: 'Xăng RON95', type: 'energy', threshold: 1.0, api_source: 'local', api_symbol: 'RON95', keywords: ['giá xăng', 'ron95', 'điều hành giá'] },

        // --- CHỨNG KHOÁN (Yahoo Finance) ---
        { id: 'VNINDEX', name: 'VN-Index', type: 'stock', threshold: 1.5, api_source: 'yahoo', api_symbol: '^VNINDEX', keywords: ['vnindex', 'chứng khoán vn', 'hose', 'cổ phiếu'] },
        { id: 'HNX', name: 'HNX-Index', type: 'stock', threshold: 1.5, api_source: 'yahoo', api_symbol: '^HASTC', keywords: ['hnx'] },
        { id: 'SP500', name: 'S&P 500', type: 'stock', threshold: 1.5, api_source: 'yahoo', api_symbol: '^GSPC', keywords: ['s&p 500', 'chứng khoán mỹ', 'wall street'] },
        { id: 'NASDAQ', name: 'Nasdaq', type: 'stock', threshold: 1.5, api_source: 'yahoo', api_symbol: '^IXIC', keywords: ['nasdaq', 'cổ phiếu công nghệ', 'big tech'] },
        { id: 'DOW', name: 'Dow Jones', type: 'stock', threshold: 1.5, api_source: 'yahoo', api_symbol: '^DJI', keywords: ['dow jones', 'chứng khoán mỹ'] },

        // --- TIỀN SỐ (Binance) ---
        { id: 'BTC', name: 'Bitcoin', type: 'crypto', threshold: 3.0, api_source: 'coingecko', api_symbol: 'bitcoin', keywords: ['bitcoin', 'btc', 'tiền ảo', 'tiền mã hóa'] },
        { id: 'ETH', name: 'Ethereum', type: 'crypto', threshold: 4.0, api_source: 'coingecko', api_symbol: 'ethereum', keywords: ['ethereum', 'eth'] },
        // --- NÔNG SẢN & LOGISTICS (Yahoo Finance) ---
        { id: 'COFFEE', name: 'Cà phê', type: 'agriculture', threshold: 2.0, api_source: 'yahoo', api_symbol: 'KC=F', keywords: ['cà phê', 'robusta', 'arabica', 'xuất khẩu nông sản'] },
        { id: 'RICE', name: 'Gạo', type: 'agriculture', threshold: 2.0, api_source: 'yahoo', api_symbol: 'ZR=F', keywords: ['gạo', 'xuất khẩu gạo', 'lương thực'] },
        { id: 'COPPER', name: 'Đồng', type: 'metal', threshold: 2.0, api_source: 'yahoo', api_symbol: 'HG=F', keywords: ['đồng', 'copper', 'kim loại công nghiệp'] }
    ]
};

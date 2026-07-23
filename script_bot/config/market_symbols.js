// FILE: script_bot/config/market_symbols.js

module.exports = {
    // TẦNG 1 & 2: Danh sách 25 chỉ số cốt lõi và ngưỡng cảnh báo
    SYMBOLS: [
        // --- TIỀN TỆ ---
        { id: 'USD_VND', name: 'USD/VND', type: 'currency', threshold: 0.5, keywords: ['usd', 'tỷ giá', 'ngân hàng nhà nước', 'ngoại tệ'] },
        { id: 'DXY', name: 'Dollar Index (DXY)', type: 'currency', threshold: 0.5, keywords: ['dxy', 'đồng đô la', 'usd', 'fed'] },
        { id: 'EUR_USD', name: 'EUR/USD', type: 'currency', threshold: 0.5, keywords: ['eur', 'euro', 'ecb'] },
        { id: 'USD_JPY', name: 'USD/JPY', type: 'currency', threshold: 0.5, keywords: ['jpy', 'yên nhật', 'boj'] },

        // --- KIM LOẠI QUÝ ---
        { id: 'GOLD_W', name: 'Vàng thế giới', type: 'metal', threshold: 1.0, keywords: ['vàng thế giới', 'gold', 'xau', 'fed'] },
        { id: 'GOLD_SJC', name: 'Vàng SJC', type: 'metal', threshold: 1.0, keywords: ['vàng sjc', 'giá vàng trong nước', 'vàng miếng'] },
        { id: 'GOLD_RING', name: 'Vàng nhẫn', type: 'metal', threshold: 1.0, keywords: ['vàng nhẫn', 'vàng 9999'] },
        { id: 'SILVER', name: 'Bạc', type: 'metal', threshold: 2.0, keywords: ['bạc', 'silver', 'kim loại'] },

        // --- NĂNG LƯỢNG ---
        { id: 'BRENT', name: 'Dầu Brent', type: 'energy', threshold: 2.0, keywords: ['dầu brent', 'giá dầu', 'opec'] },
        { id: 'WTI', name: 'Dầu WTI', type: 'energy', threshold: 2.0, keywords: ['dầu wti', 'dầu thô', 'opec'] },
        { id: 'NAT_GAS', name: 'Khí tự nhiên', type: 'energy', threshold: 3.0, keywords: ['khí tự nhiên', 'lng', 'khí đốt'] },
        { id: 'GAS_VN', name: 'Xăng RON95', type: 'energy', threshold: 1.0, keywords: ['giá xăng', 'ron95', 'điều hành giá'] },

        // --- CHỨNG KHOÁN ---
        { id: 'VNINDEX', name: 'VN-Index', type: 'stock', threshold: 1.5, keywords: ['vnindex', 'chứng khoán vn', 'hose', 'cổ phiếu'] },
        { id: 'HNX', name: 'HNX-Index', type: 'stock', threshold: 1.5, keywords: ['hnx'] },
        { id: 'SP500', name: 'S&P 500', type: 'stock', threshold: 1.5, keywords: ['s&p 500', 'chứng khoán mỹ', 'wall street'] },
        { id: 'NASDAQ', name: 'Nasdaq', type: 'stock', threshold: 1.5, keywords: ['nasdaq', 'cổ phiếu công nghệ', 'big tech'] },
        { id: 'DOW', name: 'Dow Jones', type: 'stock', threshold: 1.5, keywords: ['dow jones', 'chứng khoán mỹ'] },

        // --- TIỀN SỐ ---
        { id: 'BTC', name: 'Bitcoin', type: 'crypto', threshold: 3.0, keywords: ['bitcoin', 'btc', 'tiền ảo', 'tiền mã hóa'] },
        { id: 'ETH', name: 'Ethereum', type: 'crypto', threshold: 4.0, keywords: ['ethereum', 'eth'] },

        // --- NÔNG SẢN & LOGISTICS (TẦNG 2 ƯU TIÊN) ---
        { id: 'COFFEE', name: 'Cà phê', type: 'agriculture', threshold: 2.0, keywords: ['cà phê', 'robusta', 'arabica', 'xuất khẩu nông sản'] },
        { id: 'RICE', name: 'Gạo', type: 'agriculture', threshold: 2.0, keywords: ['gạo', 'xuất khẩu gạo', 'lương thực'] },
        { id: 'COPPER', name: 'Đồng', type: 'metal', threshold: 2.0, keywords: ['đồng', 'copper', 'kim loại công nghiệp'] },
        { id: 'FREIGHT', name: 'Cước vận tải biển', type: 'logistics', threshold: 5.0, keywords: ['cước vận tải', 'container', 'baltic dry', 'chuỗi cung ứng'] }
    ]
};

// Cấu hình các mã thị trường để theo dõi
// Keyword dùng để Rule Engine móc nối bản tin với mã thị trường tương ứng.

module.exports = {
    SYMBOLS: [
        { id: 'GOLD', name: 'Giá Vàng', type: 'commodity', keywords: ['vàng', 'gold', 'xau', 'sjc'] },
        { id: 'USD', name: 'Tỷ giá USD', type: 'currency', keywords: ['usd', 'đô la', 'tỷ giá', 'ngoại tệ'] },
        { id: 'BTC', name: 'Bitcoin', type: 'crypto', keywords: ['bitcoin', 'btc', 'tiền ảo', 'crypto'] },
        { id: 'VNINDEX', name: 'VN-Index', type: 'stock', keywords: ['vnindex', 'chứng khoán vn', 'hose'] },
        { id: 'OIL_WTI', name: 'Dầu WTI', type: 'commodity', keywords: ['dầu thô', 'wti', 'xăng dầu', 'opec', 'brent'] }
    ],
    
    // API Endpoints giả định (Sẽ thay thế bằng API thật ở module market_data)
    ENDPOINTS: {
        CRYPTO: 'https://api.binance.com/api/v3/ticker/24hr?symbol=',
        FOREX: 'https://api.exchangerate-api.com/v4/latest/'
    }
};

const { SYMBOLS } = require('../../config/market_symbols');
const logger = require('../utils/logger');

// --- YAHOO FINANCE: Cập nhật lấy lịch sử 5 ngày để vẽ biểu đồ ---
async function fetchFromYahoo(symbolsConfig) {
    const results = await Promise.all(symbolsConfig.map(async (config) => {
        // Cập nhật URL thêm range=5d để lấy mảng lịch sử
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${config.api_symbol}?range=5d&interval=1d`;
        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
            });
            
            if (!response.ok) return null;
            
            const data = await response.json();
            const result = data.chart.result[0];
            const meta = result.meta;
            const price = meta.regularMarketPrice;
            const prevClose = meta.previousClose;
            
            let changePercent = 0;
            if (prevClose && price) {
                changePercent = ((price - prevClose) / prevClose) * 100;
            }

            // Bóc tách mảng lịch sử giá (History) cho biểu đồ
            let history = [];
            let historyLabels = [];
            if (result.timestamp && result.indicators.quote[0].close) {
                const timestamps = result.timestamp;
                const closes = result.indicators.quote[0].close;
                
                timestamps.forEach((ts, idx) => {
                    if (closes[idx] !== null && closes[idx] !== undefined) {
                        history.push(parseFloat(closes[idx].toFixed(2)));
                        const date = new Date(ts * 1000);
                        historyLabels.push(`${date.getDate()}/${date.getMonth() + 1}`);
                    }
                });
            }

            // Fallback nếu API Yahoo trả về thiếu mảng lịch sử
            if (history.length === 0) {
                history = [prevClose, price];
                historyLabels = ['T-1', 'T0'];
            }

            return {
                ...config,
                category: config.category || 'Thị trường chung', // Gom nhóm lĩnh vực
                unit: config.unit || 'Điểm',                      // Đơn vị
                price: parseFloat(price.toFixed(2)),
                change_percent: (changePercent > 0 ? '+' : '') + parseFloat(changePercent.toFixed(2)) + '%',
                raw_change: changePercent,
                trend: changePercent >= 0 ? '↑' : '↓',
                history: history,                         // Truyền lịch sử giá vào JSON
                history_labels: historyLabels,            // Truyền nhãn thời gian vào JSON
                updated_at: Date.now()
            };
        } catch (error) {
            logger.warn(`Lỗi fetch mã ${config.api_symbol} từ Yahoo: ${error.message}`);
            return null;
        }
    }));
    
    return results.filter(Boolean);
}

// --- COINGECKO: Sinh mảng giả lập nội suy 24h để vẽ Chart mượt mà ---
async function fetchFromCoinGecko(symbolsConfig) {
    const ids = symbolsConfig.map(s => s.api_symbol).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LuotBot/1.0' }
        });
        
        if (!response.ok) throw new Error(`CoinGecko API lỗi: ${response.status}`);
        
        const data = await response.json();
        
        return symbolsConfig.map(config => {
            const apiData = data[config.api_symbol];
            if (!apiData) return null;

            const price = apiData.usd;
            const changePercent = apiData.usd_24h_change || 0;

            // Tính toán ra mốc giá của 24h trước
            const prevPrice = price / (1 + (changePercent / 100));
            const diff = price - prevPrice;
            
            // Xây dựng mảng 6 điểm nối nội suy để vẽ biểu đồ (an toàn 100%, không lo limit rate)
            const decimals = price < 1 ? 4 : 2; // Xử lý các coin có giá trị nhỏ
            const history = [
                prevPrice,
                prevPrice + diff * 0.15,
                prevPrice + diff * 0.40,
                prevPrice + diff * 0.65,
                prevPrice + diff * 0.85,
                price
            ].map(p => parseFloat(p.toFixed(decimals)));

            const historyLabels = ['T-24h', 'T-18h', 'T-12h', 'T-6h', 'T-2h', 'Hiện tại'];

            return {
                ...config,
                category: config.category || 'Tiền điện tử',
                unit: config.unit || 'USD',
                price: parseFloat(price.toFixed(decimals)),
                change_percent: (changePercent > 0 ? '+' : '') + parseFloat(changePercent.toFixed(2)) + '%',
                raw_change: changePercent,
                trend: changePercent >= 0 ? '↑' : '↓',
                history: history,
                history_labels: historyLabels,
                updated_at: Date.now()
            };
        }).filter(Boolean);
    } catch (error) {
        logger.error('Lỗi khi fetch dữ liệu từ CoinGecko:', error);
        return [];
    }
}

// --- LOCAL MOCKS: Dự phòng cho các mã chưa có API ---
function getLocalMocks(symbolsConfig) {
    return symbolsConfig.map(config => ({
        ...config,
        category: config.category || 'Hàng hóa / Local',
        unit: config.unit || '',
        price: 'Đang cập nhật',
        change_percent: '0.0%',
        raw_change: 0,
        trend: '↑',
        history: [100, 101, 99, 102, 103, 105],
        history_labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
        updated_at: Date.now()
    }));
}

// --- TỔNG HỢP API ---
async function fetchAllLiveMarketData() {
    const yahooSymbols = SYMBOLS.filter(s => s.api_source === 'yahoo');
    const coinGeckoSymbols = SYMBOLS.filter(s => s.api_source === 'coingecko');
    const localSymbols = SYMBOLS.filter(s => s.api_source === 'local');

    const [yahooData, cryptoData] = await Promise.all([
        fetchFromYahoo(yahooSymbols),
        fetchFromCoinGecko(coinGeckoSymbols)
    ]);

    const localData = getLocalMocks(localSymbols);

    return [...yahooData, ...cryptoData, ...localData];
}

module.exports = { fetchAllLiveMarketData };

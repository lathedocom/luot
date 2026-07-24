const { SYMBOLS } = require('../../config/market_symbols');
const logger = require('../utils/logger');

// --- YAHOO FINANCE: Dùng v8/chart để lách luật 401 Unauthorized ---
async function fetchFromYahoo(symbolsConfig) {
    const results = await Promise.all(symbolsConfig.map(async (config) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${config.api_symbol}?interval=1d`;
        try {
            const response = await fetch(url, {
                // Đổi User-Agent sang Mac để ngụy trang tốt hơn
                headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
            });
            
            if (!response.ok) return null;
            
            const data = await response.json();
            const meta = data.chart.result[0].meta;
            const price = meta.regularMarketPrice;
            const prevClose = meta.previousClose;
            
            let changePercent = 0;
            if (prevClose && price) {
                changePercent = ((price - prevClose) / prevClose) * 100;
            }

            return {
                ...config,
                price: parseFloat(price.toFixed(2)),
                change_percent: (changePercent > 0 ? '+' : '') + parseFloat(changePercent.toFixed(2)) + '%',
                raw_change: changePercent,
                trend: changePercent >= 0 ? '↑' : '↓',
                updated_at: Date.now()
            };
        } catch (error) {
            logger.warn(`Lỗi fetch mã ${config.api_symbol} từ Yahoo: ${error.message}`);
            return null;
        }
    }));
    
    return results.filter(Boolean);
}

// --- COINGECKO: Thay thế Binance để tránh lỗi 451 (Chặn IP Mỹ) ---
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

            return {
                ...config,
                price: parseFloat(price.toFixed(2)),
                change_percent: (changePercent > 0 ? '+' : '') + parseFloat(changePercent.toFixed(2)) + '%',
                raw_change: changePercent,
                trend: changePercent >= 0 ? '↑' : '↓',
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
        price: 'Đang cập nhật',
        change_percent: '0.0%',
        raw_change: 0,
        trend: '↑',
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

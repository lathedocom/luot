const { SYMBOLS } = require('../../config/market_symbols');
const logger = require('../utils/logger');

async function fetchFromYahoo(symbolsConfig) {
    const tickers = symbolsConfig.map(s => s.api_symbol).join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${tickers}`;
    
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0' }
        });
        
        if (!response.ok) throw new Error(`Yahoo API lỗi: ${response.status}`);
        
        const data = await response.json();
        const results = data.quoteResponse.result;
        
        return symbolsConfig.map(config => {
            const apiData = results.find(r => r.symbol === config.api_symbol);
            if (!apiData) return null;

            const price = apiData.regularMarketPrice || 0;
            const changePercent = apiData.regularMarketChangePercent || 0;

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
        logger.error('Lỗi khi fetch dữ liệu từ Yahoo Finance:', error);
        return [];
    }
}

async function fetchFromBinance(symbolsConfig) {
    const tickers = symbolsConfig.map(s => `"${s.api_symbol}"`).join(',');
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=[${tickers}]`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Binance API lỗi: ${response.status}`);
        
        const data = await response.json();
        
        return symbolsConfig.map(config => {
            const apiData = data.find(r => r.symbol === config.api_symbol);
            if (!apiData) return null;

            const price = parseFloat(apiData.lastPrice);
            const changePercent = parseFloat(apiData.priceChangePercent);

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
        logger.error('Lỗi khi fetch dữ liệu từ Binance:', error);
        return [];
    }
}

function getLocalMocks(symbolsConfig) {
    // Tạm thời trả về dữ liệu tĩnh cho các chỉ số VN chờ có Crawler riêng
    return symbolsConfig.map(config => ({
        ...config,
        price: 'Đang cập nhật',
        change_percent: '0.0%',
        raw_change: 0,
        trend: '↑',
        updated_at: Date.now()
    }));
}

async function fetchAllLiveMarketData() {
    const yahooSymbols = SYMBOLS.filter(s => s.api_source === 'yahoo');
    const binanceSymbols = SYMBOLS.filter(s => s.api_source === 'binance');
    const localSymbols = SYMBOLS.filter(s => s.api_source === 'local');

    const [yahooData, binanceData] = await Promise.all([
        fetchFromYahoo(yahooSymbols),
        fetchFromBinance(binanceSymbols)
    ]);

    const localData = getLocalMocks(localSymbols);

    return [...yahooData, ...binanceData, ...localData];
}

module.exports = { fetchAllLiveMarketData };

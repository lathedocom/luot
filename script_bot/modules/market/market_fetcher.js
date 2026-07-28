const { SYMBOLS } = require('../../config/market_symbols');
const logger = require('../utils/logger');
const cheerio = require('cheerio'); 

// --- YAHOO FINANCE ---
async function fetchFromYahoo(symbolsConfig) {
    const results = await Promise.all(symbolsConfig.map(async (config) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${config.api_symbol}?range=5d&interval=1d`;
        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            if (!response.ok) return null;
            const data = await response.json();
            const result = data.chart.result[0];
            const meta = result.meta;
            const price = meta.regularMarketPrice;
            const prevClose = meta.previousClose;
            
            let changePercent = 0;
            if (prevClose && price) changePercent = ((price - prevClose) / prevClose) * 100;

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

            if (history.length === 0) { history = [prevClose, price]; historyLabels = ['T-1', 'T0']; }

            return {
                ...config,
                price: parseFloat(price.toFixed(2)).toLocaleString('vi-VN'), 
                change_percent: (changePercent > 0 ? '+' : '') + parseFloat(changePercent.toFixed(2)) + '%',
                raw_change: changePercent,
                trend: changePercent >= 0 ? '↑' : '↓',
                history: history,
                history_labels: historyLabels,
                updated_at: Date.now(),
                display_source: 'Yahoo Finance' 
            };
        } catch (error) { return null; }
    }));
    return results.filter(Boolean);
}

// --- COINGECKO ---
async function fetchFromCoinGecko(symbolsConfig) {
    if (symbolsConfig.length === 0) return [];
    const ids = symbolsConfig.map(s => s.api_symbol).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!response.ok) return [];
        const data = await response.json();
        return symbolsConfig.map(config => {
            const apiData = data[config.api_symbol];
            if (!apiData) return null;
            const price = apiData.usd;
            const changePercent = apiData.usd_24h_change || 0;
            const prevPrice = price / (1 + (changePercent / 100));
            const diff = price - prevPrice;
            const decimals = price < 1 ? 4 : 2; 
            const history = [
                prevPrice, prevPrice + diff * 0.15, prevPrice + diff * 0.40,
                prevPrice + diff * 0.65, prevPrice + diff * 0.85, price
            ].map(p => parseFloat(p.toFixed(decimals)));

            return {
                ...config,
                price: parseFloat(price.toFixed(decimals)).toLocaleString('vi-VN'),
                change_percent: (changePercent > 0 ? '+' : '') + parseFloat(changePercent.toFixed(2)) + '%',
                raw_change: changePercent,
                trend: changePercent >= 0 ? '↑' : '↓',
                history: history,
                history_labels: ['T-24h', 'T-18h', 'T-12h', 'T-6h', 'T-2h', 'Hiện tại'],
                updated_at: Date.now(),
                display_source: 'CoinGecko API' 
            };
        }).filter(Boolean);
    } catch (error) { return []; }
}

// --- CHỨNG KHOÁN VIỆT NAM (VN30, UPCOM) TỪ VNDIRECT API ---
async function fetchVietnameseStocks() {
    try {
        // API công khai của VNDirect, trả về JSON rất sạch
        const response = await fetch('https://finfo-api.vndirect.com.vn/v4/rtt/indices', {
            headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 
        });
        if (!response.ok) return null;
        const json = await response.json();
        let prices = { VN30: null, UPCOM: null };
        
        if (json && json.data) {
            json.data.forEach(item => {
                if (item.code === 'VN30') prices.VN30 = item.lastPrice;
                if (item.code === 'UPCOM') prices.UPCOM = item.lastPrice;
            });
        }
        return prices;
    } catch (error) {
        logger.warn(`Lỗi API Chứng khoán VN: ${error.message}`);
        return null; 
    }
}

// --- XĂNG DẦU (DÙNG KỸ THUẬT REGEX QUÉT TOÀN VĂN BẢN) ---
async function fetchPetrolimexData() {
    try {
        const response = await fetch('https://webgia.com/gia-xang-dau/petrolimex/', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 8000 
        });
        if (!response.ok) return null;
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Loại bỏ khoảng trắng thừa, chuyển toàn bộ nội dung web thành chuỗi 1 dòng
        const text = $('body').text().replace(/\s+/g, ' ').toUpperCase();
        let prices = { RON95: null, E5RON92: null, DIESEL: null };

        // Regex tìm số có định dạng XX.XXX nằm sau tên xăng (Bỏ qua các ký tự gây nhiễu)
        const ron95Match = text.match(/RON\s*95[^0-9]*([2-3][0-9][.,][0-9]{3})/);
        if (ron95Match) prices.RON95 = parseInt(ron95Match[1].replace(/[.,]/g, ''));

        const e5Match = text.match(/E5[^0-9]*RON\s*92[^0-9]*([2-3][0-9][.,][0-9]{3})/);
        if (e5Match) prices.E5RON92 = parseInt(e5Match[1].replace(/[.,]/g, ''));

        const doMatch = text.match(/(?:DIESEL|ĐIÊZEN|DO 0)[^0-9]*([1-2][0-9][.,][0-9]{3})/);
        if (doMatch) prices.DIESEL = parseInt(doMatch[1].replace(/[.,]/g, ''));

        return prices;
    } catch (error) {
        logger.warn(`Lỗi cào Xăng dầu: ${error.message}`);
        return null; 
    }
}

// --- NÔNG SẢN VIỆT NAM (CÀ PHÊ, HỒ TIÊU) ---
async function fetchAgriData() {
    let prices = { COFFEE_VN: null, PEPPER_VN: null };
    try {
        // Cà phê
        const resCoffee = await fetch('https://webgia.com/gia-ca-phe/', { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 });
        if (resCoffee.ok) {
            const $ = cheerio.load(await resCoffee.text());
            const text = $('body').text().replace(/\s+/g, ' ').toUpperCase();
            // Lấy giá tham chiếu tại Đắk Lắk (Khoảng 110.000 - 150.000)
            const match = text.match(/ĐẮK\s*LẮK[^0-9]*([1-9][0-9]{2}[.,][0-9]{3})/);
            if (match) prices.COFFEE_VN = parseInt(match[1].replace(/[.,]/g, ''));
        }
        
        // Hồ tiêu
        const resPepper = await fetch('https://webgia.com/gia-tieu/', { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 });
        if (resPepper.ok) {
            const $ = cheerio.load(await resPepper.text());
            const text = $('body').text().replace(/\s+/g, ' ').toUpperCase();
            // Giá hồ tiêu Đắk Lắk (Khoảng 130.000 - 180.000)
            const match = text.match(/ĐẮK\s*LẮK[^0-9]*([1-9][0-9]{2}[.,][0-9]{3})/);
            if (match) prices.PEPPER_VN = parseInt(match[1].replace(/[.,]/g, ''));
        }
    } catch (error) {
        logger.warn(`Lỗi cào Nông sản: ${error.message}`);
    }
    return prices;
}

// --- VÀNG SJC & VÀNG NHẪN (REGEX) ---
async function fetchGoldData() {
    let prices = { SJC: null, RING: null };
    try {
        const response = await fetch('https://webgia.com/gia-vang/sjc/', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 8000
        });
        if (response.ok) {
            const html = await response.text();
            const $ = cheerio.load(html);
            const text = $('body').text().replace(/\s+/g, ' ').toUpperCase();
            
            // Tìm giá SJC (ví dụ 85.000 hoặc 85,000,000). Regex bắt chuỗi 2 chữ số + 3 số 0.
            const sjcMatch = text.match(/SJC\s*(?:1L|10L)?[^0-9]*([7-9][0-9][.,][0-9]{3})/);
            if (sjcMatch) {
                let val = parseInt(sjcMatch[1].replace(/[.,]/g, '')); // 85000
                if (val > 1000) prices.SJC = val / 1000; // Đổi ra Triệu/lượng
            }

            const ringMatch = text.match(/(?:NHẪN|99,99|9999)[^0-9]*([7-9][0-9][.,][0-9]{3})/);
            if (ringMatch) {
                let val = parseInt(ringMatch[1].replace(/[.,]/g, '')); 
                if (val > 1000) prices.RING = val / 1000; 
            }
        }
    } catch (e) {
        logger.warn(`Lỗi cào Vàng: ${e.message}`);
    }
    return prices;
}

// --- TỔNG HỢP VÀ GÁN DỮ LIỆU ---
async function fetchLocalMarkets(symbolsConfig) {
    const [petrolimexPrices, goldPrices, stockPrices, agriPrices] = await Promise.all([
        fetchPetrolimexData(),
        fetchGoldData(),
        fetchVietnameseStocks(),
        fetchAgriData()
    ]);
    
    const pPrices = petrolimexPrices || {};
    const gPrices = goldPrices || {};
    const sPrices = stockPrices || {};
    const aPrices = agriPrices || {};

    return symbolsConfig.map(config => {
        let base = config.base_price || 100;
        let isRealTime = false;
        let sourceName = 'Dữ liệu mô phỏng (Mock)'; 

        // Gán Xăng Dầu
        if (config.api_symbol === 'RON95' && pPrices.RON95) {
            base = pPrices.RON95; isRealTime = true; sourceName = 'WebGia / Petrolimex';
        } else if (config.api_symbol === 'E5RON92' && pPrices.E5RON92) {
            base = pPrices.E5RON92; isRealTime = true; sourceName = 'WebGia / Petrolimex';
        } else if (config.api_symbol === 'DIESEL' && pPrices.DIESEL) {
            base = pPrices.DIESEL; isRealTime = true; sourceName = 'WebGia / Petrolimex';
        } 
        // Gán Vàng
        else if (config.api_symbol === 'SJC' && gPrices.SJC) {
            base = gPrices.SJC; isRealTime = true; sourceName = 'WebGia / SJC';
        } else if (config.api_symbol === 'RING' && gPrices.RING) {
            base = gPrices.RING; isRealTime = true; sourceName = 'WebGia / SJC';
        }
        // Gán Chứng Khoán VN
        else if (config.api_symbol === 'VN30' && sPrices.VN30) {
            base = sPrices.VN30; isRealTime = true; sourceName = 'VNDirect API / HOSE';
        } else if (config.api_symbol === 'UPCOM' && sPrices.UPCOM) {
            base = sPrices.UPCOM; isRealTime = true; sourceName = 'VNDirect API / HNX';
        }
        // Gán Nông sản
        else if (config.api_symbol === 'COFFEE_VN' && aPrices.COFFEE_VN) {
            base = aPrices.COFFEE_VN; isRealTime = true; sourceName = 'WebGia / Cà phê nội địa';
        } else if (config.api_symbol === 'PEPPER_VN' && aPrices.PEPPER_VN) {
            base = aPrices.PEPPER_VN; isRealTime = true; sourceName = 'WebGia / Hồ tiêu nội địa';
        }

        // Tạo dao động nhỏ để vẽ biểu đồ
        const history = [];
        let currentPrice = base;
        for (let i = 0; i < 6; i++) {
            const fluctuation = (Math.random() * 0.01) - 0.005; 
            if (i === 5 && isRealTime) {
                currentPrice = base; // Mốc hiện tại luôn chính xác với giá trị cào được
            } else {
                currentPrice = currentPrice * (1 + fluctuation);
            }
            if (base > 1000) history.push(Math.round(currentPrice)); 
            else history.push(parseFloat(currentPrice.toFixed(2)));   
        }

        const finalPrice = history[5];
        const prevPrice = history[4];
        let changePercent = 0;
        if (prevPrice > 0) {
            changePercent = ((finalPrice - prevPrice) / prevPrice) * 100;
        }

        return {
            ...config,
            price: finalPrice.toLocaleString('vi-VN'), 
            change_percent: (changePercent > 0 ? '+' : '') + parseFloat(changePercent.toFixed(2)) + '%',
            raw_change: changePercent,
            trend: changePercent >= 0 ? '↑' : '↓',
            history: history,
            history_labels: ['T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Hôm nay'],
            updated_at: Date.now(),
            display_source: sourceName, 
            context: isRealTime ? null : {
                causes: ['Dữ liệu đang chạy mô phỏng dự phòng (Mocks).'],
                market_impact: 'Chưa lấy được dữ liệu thời gian thực.'
            }
        };
    });
}

// --- TỔNG HỢP TOÀN BỘ API ---
async function fetchAllLiveMarketData() {
    const yahooSymbols = SYMBOLS.filter(s => s.api_source === 'yahoo');
    const coinGeckoSymbols = SYMBOLS.filter(s => s.api_source === 'coingecko');
    const localSymbols = SYMBOLS.filter(s => s.api_source === 'local');

    const [yahooData, cryptoData, localData] = await Promise.all([
        fetchFromYahoo(yahooSymbols),
        fetchFromCoinGecko(coinGeckoSymbols),
        fetchLocalMarkets(localSymbols) 
    ]);

    return [...yahooData, ...cryptoData, ...localData];
}

module.exports = { fetchAllLiveMarketData };

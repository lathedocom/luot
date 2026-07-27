const { SYMBOLS } = require('../../config/market_symbols');
const logger = require('../utils/logger');
const cheerio = require('cheerio'); // Thêm thư viện phân tích HTML

// --- YAHOO FINANCE: Lấy tỷ giá, chứng khoán, hàng hóa quốc tế ---
async function fetchFromYahoo(symbolsConfig) {
    const results = await Promise.all(symbolsConfig.map(async (config) => {
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

            if (history.length === 0) {
                history = [prevClose, price];
                historyLabels = ['T-1', 'T0'];
            }

            return {
                ...config,
                category: config.category || 'Thị trường chung',
                unit: config.unit || 'Điểm',
                price: parseFloat(price.toFixed(2)).toLocaleString('vi-VN'), // Chuyển đổi định dạng số dễ nhìn
                change_percent: (changePercent > 0 ? '+' : '') + parseFloat(changePercent.toFixed(2)) + '%',
                raw_change: changePercent,
                trend: changePercent >= 0 ? '↑' : '↓',
                history: history,
                history_labels: historyLabels,
                updated_at: Date.now()
            };
        } catch (error) {
            logger.warn(`Lỗi fetch mã ${config.api_symbol} từ Yahoo: ${error.message}`);
            return null;
        }
    }));
    
    return results.filter(Boolean);
}

// --- COINGECKO: Lấy dữ liệu tiền điện tử ---
async function fetchFromCoinGecko(symbolsConfig) {
    if (symbolsConfig.length === 0) return [];
    
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

            const prevPrice = price / (1 + (changePercent / 100));
            const diff = price - prevPrice;
            
            const decimals = price < 1 ? 4 : 2; 
            const history = [
                prevPrice,
                prevPrice + diff * 0.15,
                prevPrice + diff * 0.40,
                prevPrice + diff * 0.65,
                prevPrice + diff * 0.85,
                price
            ].map(p => parseFloat(p.toFixed(decimals)));

            return {
                ...config,
                category: config.category || 'Tiền điện tử',
                unit: config.unit || 'USD',
                price: parseFloat(price.toFixed(decimals)).toLocaleString('vi-VN'),
                change_percent: (changePercent > 0 ? '+' : '') + parseFloat(changePercent.toFixed(2)) + '%',
                raw_change: changePercent,
                trend: changePercent >= 0 ? '↑' : '↓',
                history: history,
                history_labels: ['T-24h', 'T-18h', 'T-12h', 'T-6h', 'T-2h', 'Hiện tại'],
                updated_at: Date.now()
            };
        }).filter(Boolean);
    } catch (error) {
        logger.error('Lỗi khi fetch dữ liệu từ CoinGecko:', error);
        return [];
    }
}

// --- CÀO DỮ LIỆU PETROLIMEX (THỜI GIAN THỰC) ---
async function fetchPetrolimexData() {
    try {
        const response = await fetch('https://www.petrolimex.com.vn/', {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            },
            timeout: 10000 // Chờ tối đa 10s
        });
        
        if (!response.ok) return null;
        
        const html = await response.text();
        const $ = cheerio.load(html);
        let prices = { RON95: null, E5RON92: null, DIESEL: null };

        // Quét các thẻ có khả năng chứa bảng giá
        $('tr, div, li').each((i, el) => {
            const rowText = $(el).text().replace(/\s+/g, ' ').trim().toUpperCase();
            
            // Tìm chuỗi định dạng tiền tệ (Ví dụ: 23.500 hoặc 23,500)
            const priceMatch = rowText.match(/([1-3][0-9][.,][0-9]{3})/);
            if (priceMatch) {
                // Làm sạch dấu chấm/phẩy để lấy số nguyên (23500)
                const priceValue = parseInt(priceMatch[1].replace(/[.,]/g, ''));
                
                if (rowText.includes('RON 95-III') && !prices.RON95) {
                    prices.RON95 = priceValue;
                } else if (rowText.includes('E5 RON 92') && !prices.E5RON92) {
                    prices.E5RON92 = priceValue;
                } else if ((rowText.includes('DIESEL') || rowText.includes('DO 0,05S') || rowText.includes('DO 0.05S')) && !prices.DIESEL) {
                    prices.DIESEL = priceValue;
                }
            }
        });

        return prices;
    } catch (error) {
        logger.warn(`Lỗi cào dữ liệu Petrolimex: ${error.message}`);
        return null; // Trả về null để kích hoạt cơ chế giả lập (Mocks)
    }
}

// --- XỬ LÝ THỊ TRƯỜNG NỘI ĐỊA (Cào thực tế + Giả lập dự phòng) ---
async function fetchLocalMarkets(symbolsConfig) {
    // Gọi hàm cào Petrolimex
    const petrolimexPrices = await fetchPetrolimexData() || {};

    return symbolsConfig.map(config => {
        let base = config.base_price || 100;
        let isRealTime = false;

        // Nếu là mã xăng dầu và cào được giá trị thực từ web
        if (config.api_symbol === 'RON95' && petrolimexPrices.RON95) {
            base = petrolimexPrices.RON95;
            isRealTime = true;
        } else if (config.api_symbol === 'E5RON92' && petrolimexPrices.E5RON92) {
            base = petrolimexPrices.E5RON92;
            isRealTime = true;
        } else if (config.api_symbol === 'DIESEL' && petrolimexPrices.DIESEL) {
            base = petrolimexPrices.DIESEL;
            isRealTime = true;
        }

        // Tạo mảng lịch sử dao động quanh mức giá
        const history = [];
        let currentPrice = base;
        for (let i = 0; i < 6; i++) {
            // Dao động giả lập rất nhỏ để vẽ biểu đồ
            const fluctuation = (Math.random() * 0.01) - 0.005; 
            
            // Nếu là giá thực tế, ta neo cố định điểm cuối cùng (Hôm nay) bằng giá trị chuẩn
            if (i === 5 && isRealTime) {
                currentPrice = base;
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
            category: config.category || 'Hàng hóa nội địa',
            unit: config.unit || '',
            price: finalPrice.toLocaleString('vi-VN'), 
            change_percent: (changePercent > 0 ? '+' : '') + parseFloat(changePercent.toFixed(2)) + '%',
            raw_change: changePercent,
            trend: changePercent >= 0 ? '↑' : '↓',
            history: history,
            history_labels: ['T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Hôm nay'],
            updated_at: Date.now(),
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
        fetchLocalMarkets(localSymbols) // Chạy luồng nội địa đã tích hợp cào dữ liệu
    ]);

    return [...yahooData, ...cryptoData, ...localData];
}

module.exports = { fetchAllLiveMarketData };

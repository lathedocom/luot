// TẮT KIỂM TRA SSL KHẮT KHE CỦA NODE.JS
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { SYMBOLS } = require('../../config/market_symbols');
const logger = require('../utils/logger');
const cheerio = require('cheerio'); 

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
};

// ==========================================
// 1. YAHOO & COINGECKO (Thị trường Toàn cầu)
// ==========================================
async function fetchFromYahoo(symbolsConfig) {
    const results = await Promise.all(symbolsConfig.map(async (config) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${config.api_symbol}?range=5d&interval=1d`;
        try {
            const response = await fetch(url, { headers: BROWSER_HEADERS, timeout: 10000 });
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
                history: history, history_labels: historyLabels,
                updated_at: Date.now(), display_source: 'Yahoo Finance' 
            };
        } catch (error) { return null; }
    }));
    return results.filter(Boolean);
}

async function fetchFromCoinGecko(symbolsConfig) {
    if (symbolsConfig.length === 0) return [];
    const ids = symbolsConfig.map(s => s.api_symbol).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    try {
        const response = await fetch(url, { headers: BROWSER_HEADERS, timeout: 10000 });
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
                raw_change: changePercent, trend: changePercent >= 0 ? '↑' : '↓',
                history: history, history_labels: ['T-24h', 'T-18h', 'T-12h', 'T-6h', 'T-2h', 'Hiện tại'],
                updated_at: Date.now(), display_source: 'CoinGecko' 
            };
        }).filter(Boolean);
    } catch (error) { return []; }
}

// ==========================================
// 2. CHỨNG KHOÁN (DÙNG TCBS API ĐỂ VƯỢT FIREWALL)
// ==========================================
async function fetchVietnameseStocks() {
    let prices = { VNINDEX: null, VN30: null, HNX: null, UPCOM: null };
    try {
        const res = await fetch('https://apipubaws.tcbs.com.vn/stock-insight/v1/intraday/VNINDEX/his/paging?page=0&size=1', { timeout: 10000 });
        if (res.ok) {
            const data = await res.json();
            if (data && data.data && data.data.length > 0) {
                prices.VNINDEX = data.data[0].p; 
            }
        }
    } catch (error) { 
        logger.warn(`[Lỗi Chứng khoán]: ${error.message}`); 
    }
    return prices;
}

// ==========================================
// 3. VÀNG & XĂNG DẦU (DÙNG PROXY ALLORIGINS ĐỂ NÉ BLOCK IP)
// ==========================================
async function fetchGoldAndGas() {
    let prices = { SJC: null, RING: null, RON95: null, E5RON92: null, DIESEL: null };
    const proxy = 'https://api.allorigins.win/get?url='; 
    
    // Xăng Dầu
    try {
        const url = encodeURIComponent('https://webgia.com/gia-xang-dau/petrolimex/');
        const resGas = await fetch(proxy + url, { timeout: 15000 });
        if (resGas.ok) {
            const data = await resGas.json();
            const $ = cheerio.load(data.contents); // parse nội dung bọc bên trong proxy
            $('table tbody tr').each((i, el) => {
                const text = $(el).text().toUpperCase();
                const priceStr = $(el).find('td').last().text().replace(/[^\d]/g, ''); 
                if (priceStr) {
                    const priceVal = parseInt(priceStr);
                    if (priceVal > 15000) {
                        if (text.includes('RON 95')) prices.RON95 = priceVal;
                        else if (text.includes('E5') || text.includes('RON 92')) prices.E5RON92 = priceVal;
                        else if (text.includes('DIESEL') || text.includes('DO 0.05')) prices.DIESEL = priceVal;
                    }
                }
            });
        }
    } catch (error) { logger.warn(`[Lỗi Xăng - Proxy]: ${error.message}`); }

    // Vàng SJC
    try {
        const url = encodeURIComponent('https://webgia.com/gia-vang/sjc/');
        const resGold = await fetch(proxy + url, { timeout: 15000 });
        if (resGold.ok) {
            const data = await resGold.json();
            const $ = cheerio.load(data.contents);
            $('table tbody tr').each((i, el) => {
                const text = $(el).text().toUpperCase();
                const priceStr = $(el).find('td').last().text().replace(/[^\d]/g, ''); 
                if (priceStr) {
                    const priceVal = parseFloat(priceStr);
                    let priceInMillions = priceVal > 1000000 ? priceVal / 1000000 : priceVal / 1000;
                    if ((text.includes('1 LƯỢNG') || text.includes('VÀNG SJC')) && !prices.SJC) prices.SJC = priceInMillions;
                    else if ((text.includes('NHẪN') || text.includes('1 CHỈ')) && !prices.RING) prices.RING = priceInMillions;
                }
            });
        }
    } catch (error) { logger.warn(`[Lỗi Vàng - Proxy]: ${error.message}`); }

    return prices;
}

// ==========================================
// 4. NÔNG SẢN CHUYÊN BIỆT (DÙNG PROXY ALLORIGINS)
// ==========================================
async function fetchAgriData() {
    let prices = { COFFEE_VN: null, PEPPER_VN: null };
    const proxy = 'https://api.allorigins.win/get?url=';

    try {
        const urlCoffee = encodeURIComponent('https://giacaphe.com/gia-ca-phe-noi-dia/');
        const resCoffee = await fetch(proxy + urlCoffee, { timeout: 15000 });
        if (resCoffee.ok) {
            const data = await resCoffee.json();
            const $ = cheerio.load(data.contents);
            $('table tr').each((i, el) => {
                const text = $(el).text().toUpperCase();
                if (text.includes('ĐẮK LẮK') || text.includes('DAK LAK')) {
                    const match = text.match(/([1-9][0-9]{2,3}[.,][0-9]{3})/);
                    if (match) prices.COFFEE_VN = parseInt(match[1].replace(/[.,]/g, ''));
                }
            });
        }
        
        const urlPepper = encodeURIComponent('https://giatieu.com/gia-tieu-trong-nuoc/');
        const resPepper = await fetch(proxy + urlPepper, { timeout: 15000 });
        if (resPepper.ok) {
            const data = await resPepper.json();
            const $ = cheerio.load(data.contents);
            $('table tr').each((i, el) => {
                const text = $(el).text().toUpperCase();
                if (text.includes('ĐẮK LẮK') || text.includes('DAK LAK')) {
                    const match = text.match(/([1-9][0-9]{2,3}[.,][0-9]{3})/);
                    if (match) prices.PEPPER_VN = parseInt(match[1].replace(/[.,]/g, ''));
                }
            });
        }
    } catch (error) { logger.warn(`[Lỗi Nông sản - Proxy]: ${error.message}`); }
    return prices;
}

// ==========================================
// 5. VẬT LIỆU (TRADING ECONOMICS CHO HRC)
// ==========================================
async function fetchTradingEconomicsData() {
    let prices = { IRON_ORE: null, STEEL_HRC: null, NICKEL: null };
    const urls = [
        { key: 'STEEL_HRC', url: 'https://tradingeconomics.com/commodity/hrc-steel' },
        { key: 'IRON_ORE', url: 'https://tradingeconomics.com/commodity/iron-ore' }
    ];

    for (const item of urls) {
        try {
            const response = await fetch(item.url, { headers: BROWSER_HEADERS, timeout: 10000 });
            if (response.ok) {
                const html = await response.text();
                const $ = cheerio.load(html);
                const priceText = $('#current_price').text() || $('.market-summary-current').first().text();
                if (priceText) {
                    const val = parseFloat(priceText.replace(/[^\d.]/g, ''));
                    if (val > 0) prices[item.key] = val;
                }
            }
        } catch (e) { logger.warn(`[Lỗi Vật liệu ${item.key}]: ${e.message}`); }
    }
    return prices;
}

// ==========================================
// 6. CÀO LÃI SUẤT VIETCOMBANK (TỪ FILE XML CHUẨN)
// ==========================================
async function fetchInterestRates() {
    let rates = { VCB_1M: null, VCB_12M: null };
    try {
        const res = await fetch('https://portal.vietcombank.com.vn/UserControls/TVPortal.TyGia/pXML.aspx?b=ls', { 
            headers: BROWSER_HEADERS, timeout: 10000 
        });
        if (res.ok) {
            const xml = await res.text();
            const $ = cheerio.load(xml, { xmlMode: true });
            
            $('Rate').each((i, el) => {
                const term = $(el).attr('Term');
                const value = parseFloat($(el).attr('Value'));
                if (term === '1 Tháng' && !rates.VCB_1M) rates.VCB_1M = value;
                if (term === '12 Tháng' && !rates.VCB_12M) rates.VCB_12M = value;
            });
        }
    } catch (error) { 
        logger.warn(`[Lỗi Lãi suất VCB]: ${error.message}`); 
    }
    return rates;
}


// ==========================================
// 7. GÁN DỮ LIỆU CỤ THỂ CHO TỪNG NHÓM (CẬP NHẬT FULL)
// ==========================================
async function fetchLocalMarkets(symbolsConfig) {
    const [stocks, goldGas, agri, materials, interest] = await Promise.all([
        fetchVietnameseStocks(),
        fetchGoldAndGas(),
        fetchAgriData(),
        fetchTradingEconomicsData(),
        fetchInterestRates()
    ]);
    
    const s = stocks || {};
    const gg = goldGas || {};
    const a = agri || {};
    const m = materials || {};
    const ir = interest || {};

    return symbolsConfig.map(config => {
        let base = config.base_price || 100;
        let isRealTime = false;
        let sourceName = 'Dữ liệu mô phỏng / Fallback'; 
        const sym = config.api_symbol;

        // --- Chứng Khoán ---
        if (sym === 'VNINDEX' && s.VNINDEX) { base = s.VNINDEX; isRealTime = true; sourceName = 'TCBS'; }

        // --- Xăng Dầu ---
        else if (sym === 'RON95' && gg.RON95) { base = gg.RON95; isRealTime = true; sourceName = 'Webgia/Petrolimex'; }
        else if (sym === 'E5RON92' && gg.E5RON92) { base = gg.E5RON92; isRealTime = true; sourceName = 'Webgia/Petrolimex'; }
        else if (sym === 'DIESEL' && gg.DIESEL) { base = gg.DIESEL; isRealTime = true; sourceName = 'Webgia/Petrolimex'; }
        
        // --- Vàng ---
        else if (sym === 'SJC' && gg.SJC) { base = gg.SJC; isRealTime = true; sourceName = 'Webgia/SJC'; }
        else if (sym === 'RING' && gg.RING) { base = gg.RING; isRealTime = true; sourceName = 'Webgia/SJC'; }
        
        // --- Nông Sản ---
        else if (sym === 'COFFEE_VN' && a.COFFEE_VN) { base = a.COFFEE_VN; isRealTime = true; sourceName = 'GiaCaPhe.com'; }
        else if (sym === 'PEPPER_VN' && a.PEPPER_VN) { base = a.PEPPER_VN; isRealTime = true; sourceName = 'GiaTieu.com'; }
        
        // --- Vật Liệu (Quốc tế) ---
        else if (sym === 'STEEL_HRC' && m.STEEL_HRC) { base = m.STEEL_HRC; isRealTime = true; sourceName = 'Trading Economics'; }
        else if (sym === 'IRON_ORE' && m.IRON_ORE) { base = m.IRON_ORE; isRealTime = true; sourceName = 'Trading Economics'; }

        // --- Lãi suất ---
        else if (sym === 'VCB_1M' && ir.VCB_1M) { base = ir.VCB_1M; isRealTime = true; sourceName = 'Vietcombank XML'; }
        else if (sym === 'VCB_12M' && ir.VCB_12M) { base = ir.VCB_12M; isRealTime = true; sourceName = 'Vietcombank XML'; }

        // --- CÁC MÃ KHÓ & FALLBACK (Bao gồm VN30, UPCOM, Hạt điều, Cao su...) ---
        else if (['STEEL_CB300', 'CEMENT', 'SAND', 'RUBBER_VN', 'CASHEW_VN', 'VN30', 'UPCOM', 'RICE_VN'].includes(sym)) {
            // Dữ liệu nội địa không có API, tự động dùng base_price tĩnh mô phỏng (isRealTime = false)
        }

        // Logic tạo biểu đồ lịch sử giả lập cho đường Sparkline mượt mà
        const history = [];
        let currentPrice = base;
        for (let i = 0; i < 6; i++) {
            const fluctuation = (Math.random() * 0.01) - 0.005; 
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
        if (prevPrice > 0) changePercent = ((finalPrice - prevPrice) / prevPrice) * 100;

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
                causes: ['Dữ liệu sử dụng Fallback hoặc Đang cập nhật hệ thống.'],
                market_impact: 'Biểu đồ phản ánh xu hướng giá bình quân chung.'
            }
        };
    });
}

// ==========================================
// 8. KHỞI CHẠY TỔNG HỢP TOÀN BỘ API
// ==========================================
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

// FILE: script_bot/modules/market/market_fetcher.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const path = require('path');
const HISTORY_FILE = path.join(__dirname, '../../../data/market_history.json');
const SNAPSHOT_FILE = path.join(__dirname, '../../../data/market_snapshot.json');
const { SYMBOLS } = require('../../config/market_symbols');
const logger = require('../utils/logger');
const cheerio = require('cheerio'); 

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Referer': 'https://www.google.com/',
    'Connection': 'keep-alive'
};

// ==========================================
// CÔNG CỤ FETCH AN TOÀN (RETRY + TIMEOUT + ANTI-BLOCK)
// ==========================================
async function fetchWithRetry(url, options = {}, retries = 2, timeoutMs = 8000) {
    for (let i = 0; i <= retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal, headers: BROWSER_HEADERS });
            clearTimeout(timeoutId);
            return res;
        } catch (err) {
            clearTimeout(timeoutId);
            if (i === retries) throw err;
            await new Promise(r => setTimeout(r, 1500)); // Delay trước khi retry
        }
    }
}

async function fetchHtmlSafe(url) {
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    
    const html = await res.text();
    const htmlLower = html.toLowerCase();
    
    if (htmlLower.includes("cloudflare") || htmlLower.includes("access denied") || htmlLower.includes("captcha") || html.length < 2000) {
        throw new Error(`Bị chặn bởi Firewall. HTML Snippet: ${html.substring(0, 150).replace(/\n/g, ' ')}...`);
    }
    return html;
}

// Hàm trích xuất giá linh hoạt qua nhiều selector
function extractPriceFlexible(html, selectors, regexPattern) {
    const $ = cheerio.load(html);
    let matchedText = null;

    for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
            matchedText = elements.first().text().trim();
            break; // Tìm thấy thì dừng
        }
    }
    if (!matchedText) throw new Error("Không tìm thấy Selector nào khớp");

    const match = matchedText.match(regexPattern);
    if (!match) throw new Error(`Regex fail trên text: "${matchedText.substring(0, 50)}"`);

    return match[1];
}

// Tạo Object báo lỗi sạch (Không random dữ liệu)
function buildOfflineItem(config, reason = "Không lấy được dữ liệu") {
    return {
        ...config,
        price: null,
        change_percent: "N/A",
        trend: "-",
        history: null,
        history_labels: null,
        updated_at: Date.now(),
        display_source: reason,
        status: "offline"
    };
}

// ==========================================
// MODULES FETCH (YAHOO, COINGECKO, LOCAL)
// ==========================================

async function fetchFromYahoo(symbolsConfig) {
    const results = await Promise.all(symbolsConfig.map(async (config) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${config.api_symbol}?range=5d&interval=1d`;
        try {
            const response = await fetchWithRetry(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            const result = data.chart.result[0];
            const meta = result.meta;
            const price = meta.regularMarketPrice;
            const prevClose = meta.previousClose;
            
            let changePercent = 0;
            if (prevClose && price) changePercent = ((price - prevClose) / prevClose) * 100;

            let history = [], historyLabels = [];
            if (result.timestamp && result.indicators.quote[0].close) {
                result.timestamp.forEach((ts, idx) => {
                    const closeVal = result.indicators.quote[0].close[idx];
                    if (closeVal) {
                        history.push(parseFloat(closeVal.toFixed(2)));
                        const d = new Date(ts * 1000);
                        historyLabels.push(`${d.getDate()}/${d.getMonth() + 1}`);
                    }
                });
            }

            return {
                ...config,
                price: parseFloat(price.toFixed(2)).toLocaleString('vi-VN'), 
                change_percent: (changePercent > 0 ? '+' : '') + parseFloat(changePercent.toFixed(2)) + '%',
                trend: changePercent >= 0 ? '↑' : '↓',
                history: history.length ? history : null,
                history_labels: historyLabels.length ? historyLabels : null,
                updated_at: Date.now(), 
                display_source: config.official_source,
                status: "online"
            };
        } catch (error) {
            logger.warn(`[Lỗi Yahoo] ${config.api_symbol}: ${error.message}`);
            return buildOfflineItem(config, "Lỗi API Yahoo");
        }
    }));
    return results.filter(Boolean);
}

async function fetchFromCoinGecko(symbolsConfig) {
    if (symbolsConfig.length === 0) return [];
    const ids = symbolsConfig.map(s => s.api_symbol).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    
    try {
        const response = await fetchWithRetry(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        return symbolsConfig.map(config => {
            const apiData = data[config.api_symbol];
            if (!apiData) return buildOfflineItem(config, "Không có dữ liệu CoinGecko");
            
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
                trend: changePercent >= 0 ? '↑' : '↓',
                history: history, 
                history_labels: ['T-24h', 'T-18h', 'T-12h', 'T-6h', 'T-2h', 'Hiện tại'],
                updated_at: Date.now(), 
                display_source: config.official_source,
                status: "online"
            };
        });
    } catch (error) {
        logger.warn(`[Lỗi CoinGecko]: ${error.message}`);
        return symbolsConfig.map(config => buildOfflineItem(config, "Lỗi API CoinGecko"));
    }
}

async function fetchLocalMarkets(localSymbols) {
    const results = [];

    for (const config of localSymbols) {
        try {
            let priceVal = null;
            let url = '';

            if (config.api_symbol === 'RON95') {
                url = 'https://webgia.com/gia-xang-dau/petrolimex/';
                const html = await fetchHtmlSafe(url);
                const valStr = extractPriceFlexible(html, ['table tbody tr', '.price-table tr', 'table tr'], /([1-9][0-9]{0,3}[.,\s]?[0-9]{3})/);
                priceVal = parseInt(valStr.replace(/[^\d]/g, ''));
            } 
            else if (config.api_symbol === 'GOLD_SJC') {
                url = 'https://webgia.com/gia-vang/sjc/';
                const html = await fetchHtmlSafe(url);
                const valStr = extractPriceFlexible(html, ['table tbody tr', '.price-table tr', 'table tr'], /([1-9][0-9]{0,3}[.,\s]?[0-9]{3})/);
                const rawVal = parseInt(valStr.replace(/[^\d]/g, ''));
                priceVal = rawVal > 1000000 ? rawVal / 1000000 : rawVal / 1000;
            }
            else if (config.api_symbol === 'COFFEE_VN') {
                url = 'https://giacaphe.com/gia-ca-phe-noi-dia/';
                const html = await fetchHtmlSafe(url);
                const valStr = extractPriceFlexible(html, ['table tr', '.table-coffee tr'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
                priceVal = parseInt(valStr.replace(/[^\d]/g, ''));
            }
            else if (config.api_symbol === 'PEPPER_VN') {
                url = 'https://giatieu.com/gia-tieu-trong-nuoc/';
                const html = await fetchHtmlSafe(url);
                const valStr = extractPriceFlexible(html, ['table tr', '.table-pepper tr'], /([1-9][0-9]{2,3}[.,\s]?[0-9]{3})/);
                priceVal = parseInt(valStr.replace(/[^\d]/g, ''));
            }

            if (!priceVal) throw new Error("Price extraction returned null");

            results.push({
                ...config,
                price: priceVal.toLocaleString('vi-VN'),
                change_percent: "0%", 
                trend: "-",
                history: [priceVal], // Chỉ có giá trị hiện hành
                history_labels: ["Hôm nay"],
                updated_at: Date.now(),
                display_source: config.official_source,
                status: "online"
            });

        } catch (error) {
            logger.warn(`[Lỗi Nội Địa ${config.api_symbol}]: ${error.message}`);
            results.push(buildOfflineItem(config));
        }
    }

    return results;
}

// ==========================================
// MODULE: VNDIRECT INDEX (Lấy VN-Index, HNX)
// ==========================================
async function fetchVNDirectIndex(symbolsConfig) {
    if (symbolsConfig.length === 0) return [];
    const codes = symbolsConfig.map(s => s.api_symbol).join(',');
    const url = `https://finfo-api.vndirect.com.vn/v4/stock_indexes?q=code:${codes}`;
    
    try {
        const response = await fetchWithRetry(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const json = await response.json();
        const dataList = json.data || [];

        return symbolsConfig.map(config => {
            const apiData = dataList.find(d => d.code === config.api_symbol);
            if (!apiData) return buildOfflineItem(config, "Không tìm thấy mã");

            const price = apiData.indexValue;
            const change = apiData.change;
            const changePercent = apiData.changePct;
            const prevPrice = price - change;

            return {
                ...config,
                price: parseFloat(price.toFixed(2)).toLocaleString('vi-VN'),
                change_percent: (changePercent > 0 ? '+' : '') + parseFloat(changePercent.toFixed(2)) + '%',
                raw_change: changePercent,
                trend: changePercent >= 0 ? '↑' : '↓',
                history: [parseFloat(prevPrice.toFixed(2)), parseFloat(price.toFixed(2))],
                history_labels: ['Phiên trước', 'Hiện tại'],
                updated_at: Date.now(),
                display_source: config.official_source,
                status: "online"
            };
        });
    } catch (error) {
        logger.warn(`[Lỗi VNDirect Index]: ${error.message}`);
        return symbolsConfig.map(config => buildOfflineItem(config, "Lỗi API Chứng khoán"));
    }
}

// ==========================================
// MODULE: STATIC DATA (Dữ liệu tham chiếu cố định)
// ==========================================
async function fetchStaticMarkets(symbolsConfig) {
    return symbolsConfig.map(config => {
        return {
            ...config,
            price: config.base_price.toLocaleString('vi-VN'),
            change_percent: "0%", 
            raw_change: 0,
            trend: "→",
            history: [config.base_price, config.base_price], 
            history_labels: ["Kỳ trước", "Hiện tại"],
            updated_at: Date.now(),
            display_source: config.official_source,
            status: "online"
        };
    });
}

// Placeholder cho fetchMacroData nếu bạn chưa định nghĩa
async function fetchMacroData(symbolsConfig) {
    if (symbolsConfig.length === 0) return [];
    // Hàm này được thêm tạm thời để file không lỗi. 
    // Vui lòng chèn logic thực tế của bạn hoặc thay bằng mảng cấu hình tương ứng.
    return symbolsConfig.map(config => buildOfflineItem(config, "Đang cập nhật"));
}

async function fetchAllLiveMarketData() {
    const yahooSymbols = SYMBOLS.filter(s => s.api_source === 'yahoo');
    const coinGeckoSymbols = SYMBOLS.filter(s => s.api_source === 'coingecko');
    const localSymbols = SYMBOLS.filter(s => s.api_source === 'local');
    const macroSymbols = SYMBOLS.filter(s => s.api_source === 'macro_vnd'); 
    
    // [MỚI] Lọc thêm 2 nhóm mới
    const vndIndexSymbols = SYMBOLS.filter(s => s.api_source === 'vndirect_index');
    const staticSymbols = SYMBOLS.filter(s => s.api_source === 'static');

    const [yahooData, cryptoData, localData, macroData, vndData, staticData] = await Promise.all([
        fetchFromYahoo(yahooSymbols),
        fetchFromCoinGecko(coinGeckoSymbols),
        fetchLocalMarkets(localSymbols),
        fetchMacroData(macroSymbols),
        fetchVNDirectIndex(vndIndexSymbols), // Chạy API Chứng khoán VN
        fetchStaticMarkets(staticSymbols)    // Load dữ liệu tĩnh
    ]);

    return [...yahooData, ...cryptoData, ...localData, ...macroData, ...vndData, ...staticData];
}

function initHistoryDB() {
    const dir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify({ monthly: {}, daily: {} }, null, 2));
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
}

// Hàm Tầng 2: Lưu trữ lịch sử dài hạn
function updateMarketHistory(fetchedData) {
    const historyDb = initHistoryDB();
    const todayStr = new Date().toISOString().split('T')[0];
    const monthStr = todayStr.substring(0, 7);

    fetchedData.forEach(item => {
        const id = item.id;
        let price = item.price;
        if (!price || price === null || item.status === 'offline') return;
        
        // Chuẩn hóa chuỗi giá trị về số thực để lưu lịch sử
        if (typeof price === 'string') {
            price = parseFloat(price.replace(/[^\d,-]/g, '').replace(',', '.'));
        }

        const freq = item.update_freq || 'daily';
        const targetDb = freq === 'monthly' ? historyDb.monthly : historyDb.daily;
        const timeKey = freq === 'monthly' ? monthStr : todayStr;

        if (!targetDb[id]) targetDb[id] = {};
        targetDb[id][timeKey] = price;

        // Rolling Window: Xóa dữ liệu quá cũ để file không bị phình to
        const limit = freq === 'monthly' ? 24 : 60; // Giữ 24 tháng hoặc 60 ngày
        const keys = Object.keys(targetDb[id]).sort();
        while (keys.length > limit) {
            delete targetDb[id][keys.shift()];
        }
    });

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyDb, null, 2));
    
    // Xuất Snapshot Tầng 4 cho Frontend
    const snapshot = {};
    for (const freq in historyDb) {
        for (const id in historyDb[freq]) {
            const keys = Object.keys(historyDb[freq][id]).sort();
            snapshot[id] = keys.slice(-15).map(k => ({ date: k, value: historyDb[freq][id][k] }));
        }
    }
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));

    return historyDb;
}

// Cấy dữ liệu lịch sử vào cục Data hiện tại để UI vẽ biểu đồ mượt mà
function prepareMarketDataForUI(fetchedData, historyDb) {
    return fetchedData.map(item => {
        const id = item.id;
        const freq = item.update_freq || 'daily';
        const targetDb = freq === 'monthly' ? historyDb.monthly : historyDb.daily;
        
        let historyPrices = item.history || [];
        let historyLabels = item.history_labels || [];

        if (targetDb[id]) {
            const keys = Object.keys(targetDb[id]).sort();
            const sliceCount = freq === 'monthly' ? 5 : 7; // Chỉ lấy 5-7 mốc mới nhất cho biểu đồ nhỏ
            const recentKeys = keys.slice(-sliceCount);
            if (recentKeys.length > 0) {
                historyLabels = recentKeys.map(k => k.substring(5).replace('-', '/')); 
                historyPrices = recentKeys.map(k => targetDb[id][k]);
            }
        }

        return {
            ...item,
            history: historyPrices,
            history_labels: historyLabels
        };
    });
}

module.exports = { fetchAllLiveMarketData, updateMarketHistory, prepareMarketDataForUI };

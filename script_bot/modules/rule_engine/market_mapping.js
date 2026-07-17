const { SYMBOLS } = require('../../config/market_symbols');

/**
 * Dò tìm xem bài báo có liên quan đến loại tài sản nào không (Vàng, USD, Crypto...).
 * Phục vụ cho việc vẽ Knowledge Graph và hiển thị biến động giá.
 */
function mapMarketSymbols(text) {
    if (!text) return [];
    
    const lowerText = text.toLowerCase();
    const matched = [];

    for (const sym of SYMBOLS) {
        for (const kw of sym.keywords) {
            // Dùng Regex \b để tìm chính xác từ (tránh tìm nhầm "usd" trong chữ "used")
            const regex = new RegExp(`\\b${kw.toLowerCase()}\\b`, 'i');
            if (regex.test(lowerText)) {
                matched.push(sym.id);
                break;
            }
        }
    }
    
    return matched;
}

module.exports = { mapMarketSymbols };

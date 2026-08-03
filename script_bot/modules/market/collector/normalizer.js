// FILE: script_bot/modules/market/collector/normalizer.js

/**
 * Làm sạch chuỗi số bị dính ký tự (VD: "24.500 VND", "3,21%")
 */
function cleanNumber(rawStr) {
    if (typeof rawStr === 'number') return rawStr;
    if (!rawStr) return null;
    
    // Loại bỏ mọi ký tự không phải số, dấu phẩy hoặc dấu chấm
    let cleaned = rawStr.replace(/[^\d.,-]/g, '').trim();
    
    // Xử lý chuẩn Việt Nam (24.500,00 -> 24500.00)
    if (cleaned.includes(',') && cleaned.includes('.')) {
        if (cleaned.lastIndexOf('.') < cleaned.lastIndexOf(',')) {
            // Định dạng Anh (1,000.50)
            cleaned = cleaned.replace(/,/g, '');
        } else {
            // Định dạng Việt (1.000,50)
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        }
    } else if (cleaned.includes(',')) {
        // Chỉ có phẩy, kiểm tra xem nó là thập phân hay hàng nghìn
        const parts = cleaned.split(',');
        if (parts[parts.length - 1].length !== 3) {
            cleaned = cleaned.replace(',', '.'); // Thập phân
        } else {
            cleaned = cleaned.replace(/,/g, ''); // Hàng nghìn
        }
    }
    
    return parseFloat(cleaned);
}

/**
 * Ép dữ liệu vào Schema chuẩn duy nhất
 */
function normalizeMarketData(rawData, sourceConfig) {
    const value = cleanNumber(rawData.value);
    
    return {
        indicator_id: sourceConfig.id,
        name: sourceConfig.name,
        value: value,
        unit: sourceConfig.validation.unit,
        period: rawData.period || new Date().toISOString().split('T')[0],
        frequency: sourceConfig.frequency,
        country: rawData.country || "VN",
        source: {
            name: rawData.source?.name || "Unknown",
            url: rawData.source?.url || "",
            type: rawData.source?.type || "unknown" // official, secondary, aggregate
        },
        retrieved_at: rawData.retrieved_at || new Date().toISOString(),
        quality: {
            status: rawData.quality?.status || (value !== null && !isNaN(value) ? "unverified" : "failed"),
            method: rawData.quality?.method || "unknown", // html_text, api, ocr
            error_log: rawData.quality?.error_log || null
        }
    };
}

module.exports = { normalizeMarketData, cleanNumber };

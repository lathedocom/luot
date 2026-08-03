// FILE: script_bot/modules/market/collector/validator.js

function validateMarketData(data, rules) {
    const result = { is_valid: true, errors: [] };

    // 1. Kiểm tra kiểu dữ liệu có phải là số không
    if (typeof data.value !== 'number' || isNaN(data.value)) {
        result.is_valid = false;
        result.errors.push(`Dữ liệu không phải là số hợp lệ: ${data.value}`);
        return result;
    }

    // 2. Kiểm tra biên độ giá trị (Range Validity)
    if (data.value < rules.min || data.value > rules.max) {
        result.is_valid = false;
        result.errors.push(`Giá trị ${data.value} vượt ngưỡng an toàn (${rules.min} - ${rules.max})`);
    }

    // 3. Kiểm tra đơn vị đo lường
    if (data.unit !== rules.unit) {
        result.is_valid = false;
        result.errors.push(`Sai đơn vị đo. Yêu cầu: ${rules.unit}, Thực tế: ${data.unit}`);
    }

    // Nếu dữ liệu bị lỗi, đánh cờ 'failed' để hệ thống không lưu vào History
    if (!result.is_valid) {
        data.quality.status = "failed";
        data.quality.error_log = result.errors.join(' | ');
    }

    return result;
}

module.exports = { validateMarketData };

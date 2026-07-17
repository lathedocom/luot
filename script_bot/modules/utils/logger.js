// script_bot/modules/utils/logger.js

// Biến toàn cục lưu trữ các lỗi gặp phải trong quá trình chạy
let errorLogs = [];

/**
 * Lấy thời gian hiện tại định dạng chuẩn [HH:MM:SS]
 */
function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `[${hours}:${minutes}:${seconds}]`;
}

/**
 * In thông báo bình thường (Màu trắng/mặc định)
 */
function info(message) {
    console.log(`${getCurrentTime()} ℹ️ INFO: ${message}`);
}

/**
 * In thông báo thành công (Màu xanh lá)
 */
function success(message) {
    console.log('\x1b[32m%s\x1b[0m', `${getCurrentTime()} ✅ SUCCESS: ${message}`);
}

/**
 * In cảnh báo (Màu vàng)
 */
function warn(message) {
    console.log('\x1b[33m%s\x1b[0m', `${getCurrentTime()} ⚠️ WARN: ${message}`);
}

/**
 * In thông báo lỗi (Màu đỏ) và lưu vào mảng errorLogs
 */
function error(message, errObject = null) {
    const errorMsg = `${getCurrentTime()} ❌ ERROR: ${message}`;
    console.log('\x1b[31m%s\x1b[0m', errorMsg);
    
    if (errObject && errObject.message) {
        console.log('\x1b[31m%s\x1b[0m', `   Chi tiết lỗi: ${errObject.message}`);
    }

    // Lưu lại lỗi để sau này xuất ra file pipeline_status.json
    errorLogs.push({
        time: getCurrentTime(),
        message: message,
        detail: errObject ? errObject.message : ""
    });
}

/**
 * Lấy toàn bộ danh sách lỗi đã lưu
 */
function getErrorLogs() {
    return errorLogs;
}

/**
 * Xóa trắng danh sách lỗi (Dùng cho chu kỳ chạy mới)
 */
function clearErrorLogs() {
    errorLogs = [];
}

// ---------------------------------------------------------
// KHU VỰC TEST (CHẠY ĐỘC LẬP KHÔNG ẢNH HƯỞNG DỰ ÁN)
// ---------------------------------------------------------
if (require.main === module) {
    console.log("=== BẮT ĐẦU TEST MODULE LOGGER ===");
    info("Hệ thống đang khởi động...");
    success("Đã kết nối thành công tới Database ảo.");
    warn("Tốc độ mạng đang hơi chậm.");
    error("Không thể tải tin tức từ VNExpress", new Error("Timeout exceeded"));
    
    console.log("\n=== KIỂM TRA LƯU TRỮ LỖI ===");
    console.log(getErrorLogs());
}

// Xuất các hàm ra để file khác sử dụng
module.exports = {
    info,
    success,
    warn,
    error,
    getErrorLogs,
    clearErrorLogs
};
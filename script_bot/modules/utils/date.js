/**
 * Chuyển đổi mọi định dạng thời gian (từ RSS) về chuẩn ISO 8601
 * Trả về timestamp dạng số (milliseconds) để dễ so sánh
 */
function normalizeDateToTimestamp(dateString) {
    if (!dateString) return Date.now();
    
    const parsedDate = new Date(dateString);
    // Nếu dateString lỗi (Invalid Date), lấy thời gian hiện tại
    if (isNaN(parsedDate.getTime())) {
        return Date.now();
    }
    return parsedDate.getTime();
}

/**
 * Lấy mốc thời gian cách đây N ngày (tính bằng milliseconds)
 * Phục vụ cho module timeline và báo cáo
 */
function getTimestampDaysAgo(days) {
    return Date.now() - (days * 24 * 60 * 60 * 1000);
}

/**
 * Chuyển timestamp thành chuỗi ngày tháng dễ đọc cho Frontend (nếu cần)
 */
function formatReadableDate(timestamp) {
    const d = new Date(timestamp);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

module.exports = {
    normalizeDateToTimestamp,
    getTimestampDaysAgo,
    formatReadableDate
};

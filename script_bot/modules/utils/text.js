/**
 * Xóa sạch các thẻ HTML lẫn trong RSS (Ví dụ: <a>, <img>, <br>)
 * Trả về văn bản thuần túy (plain text) để không làm AI bị nhiễu
 */
function cleanHtmlTags(htmlString) {
    if (!htmlString) return "";
    return htmlString
        .replace(/<[^>]*>?/gm, '') // Xóa thẻ HTML
        .replace(/&nbsp;/g, ' ')   // Thay khoảng trắng mã hóa
        .replace(/\n\s*\n/g, '\n') // Xóa các dòng trống liên tiếp
        .trim();
}

/**
 * Cắt ngắn văn bản nếu quá dài (Tránh vượt Token của AI)
 */
function truncateText(text, maxLength = 2000) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
}

module.exports = {
    cleanHtmlTags,
    truncateText
};

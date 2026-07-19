/**
 * Chịu trách nhiệm làm sạch chuỗi AI trả về (xóa markdown, ```json)
 * Đảm bảo JSON có thể parse được thành Object.
 */
function parseAIResponse(rawText) {
    if (!rawText) return null;
    try {
        let cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        throw new Error(`Parse JSON thất bại: ${error.message}`);
    }
}

module.exports = { parseAIResponse };

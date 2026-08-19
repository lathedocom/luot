// FILE: script_bot/modules/ai/parser.js

/**
 * Chịu trách nhiệm làm sạch chuỗi AI trả về (xóa markdown, ```json, các text thừa)
 * Đảm bảo JSON có thể parse được thành Object.
 */
function parseAIResponse(rawText) {
    if (!rawText) return null;
    try {
        // Xóa sạch các thẻ markdown
        let cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // Dùng Regex trích xuất phần lõi từ dấu { đầu tiên đến dấu } cuối cùng
        // Loại bỏ mọi câu chữ "nhiệt tình" do AI tự giải thích thêm ở đầu/cuối
        // Chú ý: Chỉ dùng ngoặc nhọn {} để tránh bắt nhầm text mảng [...] của Gemma
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            cleanText = jsonMatch[0];
        }
        
        // Parse JSON sau khi đã làm sạch
        return JSON.parse(cleanText);
    } catch (error) {
        throw new Error(`${error.message}`);
    }
}

module.exports = { parseAIResponse };

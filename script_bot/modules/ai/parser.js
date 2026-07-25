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
        
        // Dùng Regex trích xuất phần lõi từ dấu { hoặc [ đầu tiên đến dấu } hoặc ] cuối cùng
        // Điều này giúp loại bỏ mọi câu chữ "nhiệt tình" do AI tự giải thích thêm
        const jsonMatch = cleanText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        
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

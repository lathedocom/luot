// FILE: script_bot/modules/ai/parser.js
function parseAIResponse(rawText) {
    if (!rawText) return null;
    try {
        // Xóa markdown code blocks
        let cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // Cô lập khối JSON, chặn các text thừa ở đầu/cuối
        const startObj = cleanText.indexOf('{');
        const endObj = cleanText.lastIndexOf('}');
        const startArr = cleanText.indexOf('[');
        const endArr = cleanText.lastIndexOf(']');
        
        let start = -1;
        let end = -1;

        if (startObj !== -1 && endObj !== -1) { 
            start = startObj; 
            end = endObj; 
        }
        
        if (startArr !== -1 && endArr !== -1) {
            if (start === -1 || (startArr < start && endArr > end)) { 
                start = startArr; 
                end = endArr; 
            }
        }
        
        if (start !== -1 && end !== -1) {
            cleanText = cleanText.substring(start, end + 1);
        }

        // Thay thế cưỡng bức các mảng bọc bằng nháy đơn thành ngoặc kép (nếu model vẫn vi phạm)
        // Ví dụ: ['Kim Yo Jong'] -> ["Kim Yo Jong"]
        cleanText = cleanText.replace(/\[\s*'([^']+)'\s*\]/g, '["$1"]');
        cleanText = cleanText.replace(/'([^']+)'\s*(,)/g, '"$1"$2');

        return JSON.parse(cleanText);
    } catch (error) {
        throw new Error(`Parse JSON lỗi: ${error.message} | Đoạn văn bản gây lỗi: ${rawText.substring(0, 150)}...`);
    }
}
module.exports = { parseAIResponse };

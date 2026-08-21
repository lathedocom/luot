// FILE: script_bot/modules/ai/parser.js
function parseAIResponse(rawText) {
    if (!rawText) return null;
    try {
        let cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // Tìm vị trí mở/đóng ngoặc chuẩn xác của Object hoặc Array
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
        
        // Ưu tiên Array nếu nó bao bọc bên ngoài Object
        if (startArr !== -1 && endArr !== -1) {
            if (start === -1 || (startArr < start && endArr > end)) {
                start = startArr;
                end = endArr;
            }
        }

        if (start !== -1 && end !== -1) {
            cleanText = cleanText.substring(start, end + 1);
        }

        return JSON.parse(cleanText);
    } catch (error) {
        throw new Error(`Parse JSON lỗi: ${error.message} | Đoạn văn bản gây lỗi: ${rawText.substring(0, 150)}...`);
    }
}
module.exports = { parseAIResponse };

// FILE: script_bot/modules/ai/parser.js
function parseAIResponse(rawText) {
    if (!rawText) return null;
    try {
        let cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // ƯU TIÊN 1: Cắt chính xác khối Object (tránh bắt nhầm ngoặc vuông của markdown)
        const startObj = cleanText.indexOf('{');
        const endObj = cleanText.lastIndexOf('}');
        
        if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
            cleanText = cleanText.substring(startObj, endObj + 1);
        } else {
            // DỰ PHÒNG: Chỉ tìm khối Array nếu không tìm thấy Object
            const startArr = cleanText.indexOf('[');
            const endArr = cleanText.lastIndexOf(']');
            if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
                cleanText = cleanText.substring(startArr, endArr + 1);
            }
        }

        // Tự động vá lỗi mô hình quên ngoặc kép (VD: [personal, business] -> ["personal", "business"])
        cleanText = cleanText.replace(/\[\s*([a-zA-Z0-9_]+)\s*(,\s*[a-zA-Z0-9_]+\s*)*\]/g, function(match) {
            return match.replace(/([a-zA-Z0-9_]+)/g, '"$1"');
        });

        return JSON.parse(cleanText);
    } catch (error) {
        throw new Error(`Parse JSON lỗi: ${error.message} | Đoạn văn bản gây lỗi: ${rawText.substring(0, 150)}...`);
    }
}
module.exports = { parseAIResponse };

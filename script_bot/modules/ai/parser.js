// FILE: script_bot/modules/ai/parser.js
function parseAIResponse(rawText) {
    if (!rawText) return null;
    try {
        let cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // Phương án 1: Trích xuất bằng Regex quét ngoặc (Mạnh tay hơn)
        // Tìm toàn bộ cấu trúc bắt đầu bằng { và kết thúc bằng } 
        // hoặc bắt đầu bằng [ và kết thúc bằng ]
        const jsonRegex = /(\{.*\}|\[.*\])/s; 
        const match = cleanText.match(jsonRegex);
        
        if (match && match[0]) {
            cleanText = match[0];
        } else {
             // Phương án 2 (Dự phòng): Quét thủ công như cũ nếu Regex thất bại
             const startObj = cleanText.indexOf('{');
             const endObj = cleanText.lastIndexOf('}');
             const startArr = cleanText.indexOf('[');
             const endArr = cleanText.lastIndexOf(']');
             
             let start = -1;
             let end = -1;

             if (startObj !== -1 && endObj !== -1) { start = startObj; end = endObj; }
             
             if (startArr !== -1 && endArr !== -1) {
                 if (start === -1 || (startArr < start && endArr > end)) { start = startArr; end = endArr; }
             }
             
             if (start !== -1 && end !== -1) {
                 cleanText = cleanText.substring(start, end + 1);
             }
        }

        // Tự động sửa lỗi nháy đơn bọc chuỗi mảng (Ví dụ: ['VN'])
        cleanText = cleanText.replace(/\[\s*'([^']+)'\s*\]/g, '["$1"]');
        cleanText = cleanText.replace(/'([^']+)'\s*(,)/g, '"$1"$2');

        return JSON.parse(cleanText);
    } catch (error) {
        throw new Error(`Parse JSON lỗi: ${error.message} | Đoạn văn bản gây lỗi: ${rawText.substring(0, 150)}...`);
    }
}
module.exports = { parseAIResponse };

// FILE: script_bot/modules/ai/parser.js
function parseAIResponse(rawText) {
    if (!rawText) return null;
    try {
        let text = rawText.trim();
        
        // 1. Loại bỏ các block code markdown ```json ... ```
        text = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

        // 2. Tìm và cô lập khối JSON { ... } lớn nhất
        const startObj = text.indexOf('{');
        const endObj = text.lastIndexOf('}');
        
        if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
            text = text.substring(startObj, endObj + 1);
        } else {
            const startArr = text.indexOf('[');
            const endArr = text.lastIndexOf(']');
            if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
                text = text.substring(startArr, endArr + 1);
            }
        }

        // 3. TỰ ĐỘNG VÁ LỖI CÚ PHÁP CỦA GEMMA:
        
        // a) Xóa dấu ba chấm lười biếng '...' bên trong mảng/object
        text = text.replace(/\[\s*\.\.\.\s*\]/g, '[]')
                   .replace(/,\s*\.\.\.\s*(?=[}\]])/g, '')
                   .replace(/:\s*\.\.\.\s*(?=[,}])/g, ': ""')
                   .replace(/\.\.\./g, '');

        // b) Chuyển đổi nháy đơn (') sang nháy kép (") cho key và string
        text = text.replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":')
                   .replace(/:\s*'([^']*)'/g, ': "$1"');

        // c) Sửa mảng dùng nháy đơn: ['a', 'b'] -> ["a", "b"]
        text = text.replace(/\[\s*'([^']*)'\s*\]/g, '["$1"]')
                   .replace(/'([^']*)'\s*,/g, '"$1",')
                   .replace(/,\s*'([^']*)'/g, ', "$1"');

        // d) Sửa mảng unquoted: [personal, national] -> ["personal", "national"]
        text = text.replace(/\[\s*([a-zA-Z0-9_]+)\s*(?:,\s*([a-zA-Z0-9_]+)\s*)*\]/g, (match) => {
            return match.replace(/([a-zA-Z0-9_]+)/g, '"$1"');
        });

        // e) Xóa dấu phẩy thừa ở phần tử cuối: {"a": 1,} -> {"a": 1}
        text = text.replace(/,\s*([}\]])/g, '$1');

        return JSON.parse(text);
    } catch (error) {
        // Fallback khẩn cấp: trích xuất trường summary nếu JSON bị hỏng nặng
        if (rawText.includes('"summary"') || rawText.includes('"short_summary"')) {
            const match = rawText.match(/"(?:short_)?summary"\s*:\s*"([^"]+)"/);
            if (match) {
                return { summary: match[1], short_summary: match[1] };
            }
        }
        throw new Error(`Parse JSON lỗi: ${error.message} | Đoạn văn bản gây lỗi: ${rawText.substring(0, 120)}...`);
    }
}

module.exports = { parseAIResponse };

// FILE: script_bot/modules/ai/parser.js
function parseAIResponse(rawText) {
    if (!rawText) return null;
    try {
        let text = rawText.trim();
        text = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

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

        // Tự động vá lỗi mảng unquoted và nháy đơn của Gemma
        text = text.replace(/\[\s*\.\.\.\s*\]/g, '[]')
                   .replace(/,\s*\.\.\.\s*(?=[}\]])/g, '')
                   .replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":')
                   .replace(/:\s*'([^']*)'/g, ': "$1"')
                   .replace(/\[\s*([a-zA-Z0-9_]+)\s*(?:,\s*([a-zA-Z0-9_]+)\s*)*\]/g, (match) => {
                       return match.replace(/([a-zA-Z0-9_]+)/g, '"$1"');
                   });

        return JSON.parse(text);
    } catch (error) {
        // PHAOCỨU SINH: Không ném lỗi làm sập Gateway nữa, trả về Object an toàn
        console.warn(`[Parser] JSON hỏng nặng, kích hoạt Phao cứu sinh. Nội dung lỗi: ${rawText.substring(0, 100)}...`);
        
        // Nếu là task EXTRACT_METADATA
        if (rawText.includes('"event"') || rawText.includes("need_deep_analysis")) {
            return {
                event: "Đang cập nhật sự kiện",
                keywords: [], entities: [], regions: [], categories: [],
                importance: 50, scope: "business", severity: 3, sentiment: 0,
                vn_impact: "Không tác động trực tiếp.",
                need_deep_analysis: false, // Bỏ qua Tầng 2 để tiết kiệm API
                short_summary: "Nội dung đang được AI cập nhật lại."
            };
        }
        
        // Nếu là task SHORT_SUMMARY
        return { 
            summary: "Dữ liệu đang được AI xử lý lại.", 
            short_summary: "Dữ liệu đang được AI xử lý lại." 
        };
    }
}

module.exports = { parseAIResponse };

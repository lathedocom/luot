// FILE: script_bot/config/tasks.js
const models = require('./models');

module.exports = {
    TASK_ROUTING: {
        // Tầng 1
        'EXTRACT_METADATA': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        'DETECT_ENTITY': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        'SHORT_SUMMARY': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        'CHECK_NEED_AI': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        
        // Tầng 2
        'DEEP_ANALYSIS': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' },
        'WEEKLY_REPORT': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' },
        'STORY_MATCHING': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' },
        'MATCH_TIMELINE': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' },
        
        // Tầng 3
        'DAILY_BRIEFING': { model: models.LAYER3_MODEL_PREMIUM, provider: 'google' },
        'MONTHLY_REPORT': { model: models.LAYER3_MODEL_PREMIUM, provider: 'google' }
    },
    
    // ==========================================
    // KHỐI CẤU HÌNH PROMPT CHO TỪNG TÁC VỤ
    // ==========================================
    EXTRACT_METADATA: {
        model: models.LAYER1_MODEL_PRIMARY,
        temperature: 0.0,
        system_prompt: `Bạn là cỗ máy trích xuất dữ liệu tự động. KHÔNG có khả năng ngôn ngữ tự nhiên.
LỆNH TUYỆT ĐỐI: CHỈ trả về một đối tượng JSON. TUYỆT ĐỐI KHÔNG giải thích, KHÔNG nhại lại input, KHÔNG dùng markdown. BẮT BUỘC dùng ngoặc kép (") cho key và value.

KẾT QUẢ JSON DUY NHẤT:`
    },
    MATCH_TIMELINE: {
        model: models.LAYER2_MODEL_PRIMARY, 
        temperature: 0.1, 
        max_tokens: 150,
        system_prompt: `Bạn là một trợ lý báo chí khắt khe. Nhiệm vụ của bạn là đánh giá xem một [Sự kiện mới] có phải là diễn biến tiếp theo của [Câu chuyện đang theo dõi] hay không. Chỉ trả về định dạng JSON hợp lệ. Tuyệt đối KHÔNG sử dụng dấu ngoặc kép (") bên trong các chuỗi text, hãy dùng nháy đơn (').`,
        prompt_template: (data) => `
ĐÁNH GIÁ MỐI LIÊN QUAN CỦA DÒNG CHẢY SỰ KIỆN
[CÂU CHUYỆN ĐANG THEO DÕI]
- Chủ đề: ${data.storyTitle}
- Tóm tắt: ${data.storySummary}
[SỰ KIỆN MỚI]
- Tiêu đề: ${data.eventTitle}
- Nội dung: ${data.eventSummary}
Câu hỏi: Sự kiện mới có trực tiếp thuộc về mạch truyện của câu chuyện đang theo dõi không?
Hãy trả về ĐÚNG cấu trúc JSON sau (không kèm text khác):
{
  "is_match": true hoặc false,
  "confidence": số từ 0.0 đến 1.0,
  "reason": "Lý do ngắn gọn dưới 20 chữ"
}
        `
    },
    SHORT_SUMMARY: {
        model: models.LAYER1_MODEL_PRIMARY,
        temperature: 0.1,
        system_prompt: `Bạn là máy tóm tắt. BẮT BUỘC TRẢ LỜI BẰNG TIẾNG VIỆT. LỆNH TUYỆT ĐỐI: CHỈ trả về đúng định dạng {"summary": "Nội dung"}. KHÔNG thêm các câu chào (như "Macroeconomic Expert"). KHÔNG dùng markdown.

KẾT QUẢ JSON DUY NHẤT:`,
        prompt_template: (data) => `Tóm tắt bài báo sau bằng Tiếng Việt:
Tiêu đề: ${data.title}
Nội dung: ${data.content}`
    },
    DEEP_ANALYSIS: {
        model: models.LAYER2_MODEL_PRIMARY,
        temperature: 0.3,
        system_prompt: `Bạn là một biên tập viên báo chí kỳ cựu. BẮT BUỘC PHẢI TRẢ LỜI 100% BẰNG TIẾNG VIỆT (VIETNAMESE) CHUẨN MỰC, tự nhiên và dễ hiểu, bất kể ngôn ngữ của bài viết gốc là gì. Tuyệt đối không giữ lại nguyên văn tiếng nước ngoài trong phần phân tích.`,
        prompt_template: (data) => `Hãy phân tích chi tiết bài báo sau đây bằng Tiếng Việt:
Tiêu đề: ${data.title}
Nội dung: ${data.content}`
    }
};

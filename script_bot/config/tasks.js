// script_bot/config/tasks.js
const models = require('./models');

module.exports = {
    TASK_ROUTING: {
        // Tầng 1: Dùng Gemma (Free 14.4K/ngày)
        'EXTRACT_METADATA': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        'DETECT_ENTITY': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        'SHORT_SUMMARY': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        'CHECK_NEED_AI': { model: models.LAYER1_MODEL_PRIMARY, provider: 'google' },
        
        // Tầng 2: Dùng 3.1 Flash Lite (Free 500/ngày)
        'DEEP_ANALYSIS': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' },
        'WEEKLY_REPORT': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' },
        
        // Tầng 3: Dùng 3 Flash (Free 20/ngày - Giữ gìn cẩn thận)
        'DAILY_BRIEFING': { model: models.LAYER3_MODEL_PREMIUM, provider: 'google' },
        'MONTHLY_REPORT': { model: models.LAYER3_MODEL_PREMIUM, provider: 'google' },
        
        // Thêm vào khối TASK_ROUTING
        'STORY_MATCHING': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' } // Dùng Flash Lite nhanh và rẻ
    }, // <-- Quan trọng: Cần có dấu phẩy ở đây để ngăn cách giữa TASK_ROUTING và MATCH_TIMELINE

    MATCH_TIMELINE: {
        model: "gemini-3.1-flash-lite", // Đã cập nhật sang model mới nhất, nhanh và nhẹ
        temperature: 0.1, // Cực thấp để đảm bảo tính logic, không sáng tạo
        max_tokens: 150,
        system_prompt: `Bạn là một trợ lý báo chí khắt khe. Nhiệm vụ của bạn là đánh giá xem một [Sự kiện mới] có phải là diễn biến tiếp theo của [Câu chuyện đang theo dõi] hay không. Chỉ trả về định dạng JSON hợp lệ.`,
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
    }
};

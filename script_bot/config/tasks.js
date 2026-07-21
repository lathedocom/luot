const models = require('./models');

module.exports = {
    TASK_ROUTING: {
        // Tầng 1: Dùng Gemma (Free 14.4K/ngày) qua mạng Groq
        'EXTRACT_METADATA': { model: models.LAYER1_MODEL_PRIMARY, provider: 'groq' },
        'DETECT_ENTITY': { model: models.LAYER1_MODEL_PRIMARY, provider: 'groq' },
        'SHORT_SUMMARY': { model: models.LAYER1_MODEL_PRIMARY, provider: 'groq' },
        'CHECK_NEED_AI': { model: models.LAYER1_MODEL_PRIMARY, provider: 'groq' },
        
        // Tầng 2: Dùng 3.1 Flash Lite (Free 500/ngày)
        'DEEP_ANALYSIS': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' },
        'WEEKLY_REPORT': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' },
        
        // Tầng 3: Dùng 3 Flash (Free 20/ngày - Giữ gìn cẩn thận)
        'DAILY_BRIEFING': { model: models.LAYER3_MODEL_PREMIUM, provider: 'google' },
        'MONTHLY_REPORT': { model: models.LAYER3_MODEL_PREMIUM, provider: 'google' },
        
        // Luồng gộp sự kiện
        'STORY_MATCHING': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' },
        'MATCH_TIMELINE': { model: models.LAYER2_MODEL_PRIMARY, provider: 'google' } 
    },

    // ==========================================
    // KHỐI CẤU HÌNH PROMPT CHO TỪNG TÁC VỤ
    // ==========================================

    MATCH_TIMELINE: {
        model: "gemini-3.1-flash-lite", 
        temperature: 0.1, 
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
    },

    // Bổ sung luồng tóm tắt ngắn, ép buộc Tiếng Việt
    SHORT_SUMMARY: {
        model: "gemma-4-26b-a4b-it",
        temperature: 0.3,
        system_prompt: `Bạn là trợ lý tổng hợp tin tức. BẮT BUỘC TRẢ LỜI BẰNG TIẾNG VIỆT (VIETNAMESE). Dịch toàn bộ ý chính sang tiếng Việt nếu văn bản gốc là tiếng nước ngoài. Tuyệt đối không giữ lại tiếng Anh.`,
        prompt_template: (data) => `Tóm tắt ngắn gọn bài báo sau bằng Tiếng Việt:
Tiêu đề: ${data.title}
Nội dung: ${data.content}`
    },

    // Bổ sung luồng phân tích sâu, ép buộc Tiếng Việt
    DEEP_ANALYSIS: {
        model: "gemini-3.1-flash-lite",
        temperature: 0.3,
        system_prompt: `Bạn là một biên tập viên báo chí kỳ cựu. BẮT BUỘC PHẢI TRẢ LỜI 100% BẰNG TIẾNG VIỆT (VIETNAMESE) CHUẨN MỰC, tự nhiên và dễ hiểu, bất kể ngôn ngữ của bài viết gốc là gì. Tuyệt đối không giữ lại nguyên văn tiếng nước ngoài trong phần phân tích.`,
        prompt_template: (data) => `Hãy phân tích chi tiết bài báo sau đây bằng Tiếng Việt:
Tiêu đề: ${data.title}
Nội dung: ${data.content}`
    }
};

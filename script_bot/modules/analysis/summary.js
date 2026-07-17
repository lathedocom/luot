/**
 * Chuyên trách tạo Prompt để yêu cầu AI viết tóm tắt ngắn và chi tiết.
 * Giữ nguyên tắc: Chỉ yêu cầu JSON, không nói thêm lời thừa.
 */
function buildSummaryPrompt(combinedText) {
    return `
Bạn là biên tập viên tin tức tình báo. Đọc khối tin thô sau và viết lại tóm tắt sự kiện.
Nội dung thô: ${combinedText}

LỆNH TUYỆT ĐỐI: CHỈ TRẢ VỀ ĐÚNG CẤU TRÚC JSON SAU. KHÔNG CÓ TEXT BÊN NGOÀI.
{
  "short_summary": "Tóm tắt sự kiện xảy ra cực kỳ súc tích (khoảng 30-40 từ).",
  "detailed_summary": "Tóm tắt chi tiết diễn biến logic (khoảng 80-100 từ)."
}`;
}

module.exports = { buildSummaryPrompt };

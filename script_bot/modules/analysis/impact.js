/**
 * Chuyên trách tạo Prompt để hỏi AI về chuỗi tác động của sự kiện.
 * Đã được đồng bộ chuẩn JSON với cấu trúc phân tích tình báo cao cấp.
 */
function buildImpactPrompt(combinedText) {
    return `
Bạn là chuyên gia phân tích rủi ro kinh tế - chính trị. Dựa vào sự kiện sau, hãy phân tích tác động và dự báo.
Sự kiện: ${combinedText}

LỆNH TUYỆT ĐỐI: CHỈ TRẢ VỀ ĐÚNG CẤU TRÚC JSON SAU.
{
  "causes": ["Nguyên nhân 1", "Nguyên nhân 2"],
  "effects": ["Hệ quả ngắn hạn 1", "Hệ quả dài hạn 2"],
  "affected_groups": ["Nhóm người/Doanh nghiệp bị ảnh hưởng 1", "Nhóm 2"],
  "market_impact": "Đánh giá ngắn gọn tác động thị trường",
  "significance": "Ý nghĩa cốt lõi của sự kiện này đối với bối cảnh chung (1-2 câu).",
  "unknowns": [
    "Điểm chưa được xác nhận hoặc chưa rõ ràng số 1"
  ],
  "confidence_note": "Đánh giá ngắn gọn độ tin cậy của thông tin",
  "scenarios": [
    {
      "text": "Kịch bản có thể xảy ra thứ nhất...",
      "likelihood": "cao" 
    },
    {
      "text": "Kịch bản có thể xảy ra thứ hai...",
      "likelihood": "trung bình"
    }
  ],
  "follow_up": "Điều người đọc cần theo dõi trong vài ngày tới là gì? (1 câu ngắn gọn)"
}`;
}

module.exports = { buildImpactPrompt };

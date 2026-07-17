/**
 * Chuyên trách tạo Prompt để hỏi AI về chuỗi tác động của sự kiện.
 * Đây là phần tạo ra "giá trị tình báo" cốt lõi của dự án.
 */
function buildImpactPrompt(combinedText) {
    return `
Bạn là chuyên gia phân tích rủi ro kinh tế - chính trị. Dựa vào sự kiện sau, hãy phân tích tác động.
Sự kiện: ${combinedText}

LỆNH TUYỆT ĐỐI: CHỈ TRẢ VỀ ĐÚNG CẤU TRÚC JSON SAU.
{
  "causes": ["Nguyên nhân 1", "Nguyên nhân 2"],
  "effects": ["Hệ quả ngắn hạn 1", "Hệ quả dài hạn 2"],
  "affected_groups": ["Nhóm người/Doanh nghiệp bị ảnh hưởng 1", "Nhóm 2"],
  "follow_up": "Điều người đọc cần theo dõi trong vài ngày tới là gì? (1 câu ngắn gọn)"
}`;
}

module.exports = { buildImpactPrompt };

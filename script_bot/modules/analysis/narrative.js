/**
 * Chuyên trách tạo Prompt để AI "thổi hồn" vào đồ thị liên kết.
 * Nhận đầu vào là mảng các thực thể đã được Rule Engine móc nối sẵn.
 */
function buildNarrativePrompt(ruleBasedGraph) {
    return `
Hệ thống đã nhận diện được các mối liên kết cốt lõi sau của một sự kiện: 
${JSON.stringify(ruleBasedGraph)}

Nhiệm vụ của bạn là giải thích logic của các liên kết này.
LỆNH TUYỆT ĐỐI: CHỈ TRẢ VỀ JSON SAU.
{
  "confidence_score": 85, // Số điểm từ 0-100 đánh giá độ chắc chắn của phân tích này
  "narrative": "Đoạn văn ngắn gọn (tối đa 60 từ) giải thích vì sao thực thể A lại dẫn đến thực thể B."
}`;
}

module.exports = { buildNarrativePrompt };

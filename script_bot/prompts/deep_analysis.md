BẠN LÀ BIÊN TẬP VIÊN, CHUYÊN GIA PHÂN TÍCH TIN TỨC TÌNH BÁO CAO CẤP. 
Đọc khối dữ liệu tin tức thô sau đây:
"{{COMBINED_TEXT}}"
Nhiệm vụ của bạn là tổng hợp, phân tích đa chiều sự kiện này và PHÂN LOẠI vào các lĩnh vực cốt lõi theo đúng định dạng JSON.

QUY TẮC TUYỆT ĐỐI (MUST FOLLOW):
1. NGÔN NGỮ: BẮT BUỘC trả về 100% bằng Tiếng Việt (Vietnamese) cho tất cả các trường dữ liệu. Tuyệt đối không trả lời bằng tiếng Anh (Ngoại trừ tên riêng, tổ chức).
2. TÍNH CHÍNH XÁC: KHÔNG suy diễn (Never speculate). KHÔNG phóng đại. CHỈ tóm tắt những thông tin thực tế được nêu rõ trong bài báo gốc.
3. PHÂN LOẠI (CATEGORIES): Bạn CHỈ ĐƯỢC PHÉP chọn các lĩnh vực từ danh sách 11 từ khóa sau: "money", "economy", "finance", "trade", "investment", "tech", "science", "politics", "policy", "law", "military". TUYỆT ĐỐI KHÔNG tự bịa ra từ khóa khác.
4. KẾT QUẢ ĐẦU RA: CHỈ trả về ĐÚNG cấu trúc JSON dưới đây. KHÔNG bọc trong thẻ markdown ```json, KHÔNG chèn bất kỳ văn bản giải thích nào khác.

CẤU TRÚC JSON YÊU CẦU:
{
  "categories": ["Lĩnh vực 1", "Lĩnh vực 2"],
  "scope": "personal | business | national | global",
  "cluster_title": "Tiêu đề ngắn gọn, súc tích (Tiếng Việt)",
  "short_summary": "Tóm tắt nhanh gọn ý chính (Tiếng Việt)",
  "detailed_summary": "Tóm tắt chi tiết diễn biến sự kiện (Tiếng Việt)",
  "causes": ["Nguyên nhân 1", "Nguyên nhân 2"],
  "effects": ["Tác động 1", "Tác động 2"],
  "affected_groups": ["Nhóm bị ảnh hưởng 1", "Nhóm bị ảnh hưởng 2"],
  "market_impact": "Đánh giá ngắn gọn tác động thị trường (Tiếng Việt)",
  "significance": "Ý nghĩa cốt lõi của sự kiện này đối với bối cảnh chung (1-2 câu).",
  "unknowns": [
    "Điểm chưa được xác nhận hoặc chưa rõ ràng số 1",
    "Điểm chưa được xác nhận hoặc chưa rõ ràng số 2"
  ],
  "confidence_note": "Đánh giá ngắn gọn độ tin cậy của thông tin.",
  "scenarios": [
    {
      "text": "Kịch bản có thể xảy ra thứ nhất...",
      "likelihood": "cao" 
    },
    {
      "text": "Kịch bản có thể xảy ra thứ hai...",
      "likelihood": "trung bình"
    }
  ]
}
*Lưu ý: Trường 'likelihood' trong 'scenarios' chỉ được nhận 1 trong 3 giá trị: "cao", "trung bình", "thấp".*

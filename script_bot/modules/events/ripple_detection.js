const gateway = require('../ai/gateway');

async function detectRippleEffects(events) {
    // Chỉ lấy các sự kiện lớn (severity >= 6.5) và còn mới (trong 3 ngày)
    const highSeverityEvents = events.filter(e => e.severity >= 6.5 && e.status === 'active');
    if (highSeverityEvents.length < 2) return [];

    let eventsListText = highSeverityEvents.map(e => `[ID: ${e.id}] ${e.title} (Quốc gia: ${e.country}, Chuyên mục: ${e.category})`).join('\n');

    const prompt = `Từ danh sách các sự kiện lớn dưới đây, hãy tìm ra các cặp có mối quan hệ Nhân - Quả (Lan truyền/Ripple Effect).
Danh sách:
${eventsListText}

LỆNH TUYỆT ĐỐI: CHỈ trả về mảng JSON. Không text thừa.
Mẫu: [{"source_id": "ID nguyên nhân", "target_id": "ID hệ quả", "relation": "Nêu hệ quả ngắn gọn (vd: tăng giá dầu)"}]`;

    try {
        // Mượn tạm luồng DEEP_ANALYSIS nhưng chèn prompt tùy chỉnh
        const result = await gateway.executeTask('DEEP_ANALYSIS', prompt, "Bạn là chuyên gia phân tích vĩ mô, chỉ trả JSON.");
        return Array.isArray(result) ? result : [];
    } catch (e) {
        return [];
    }
}

module.exports = { detectRippleEffects };

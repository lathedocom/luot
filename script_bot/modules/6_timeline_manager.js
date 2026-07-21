const fs = require('fs');
const path = require('path');
const gateway = require('./ai/gateway');
const logger = require('./utils/logger');

// Đổi tên file lưu trữ thành timeline_data.json cho đúng chuẩn Story-centric
const STORY_FILE = path.join(__dirname, '../../timeline_data.json');

// Khởi tạo file nếu chưa tồn tại
function loadStories() {
    if (!fs.existsSync(STORY_FILE)) {
        fs.writeFileSync(STORY_FILE, JSON.stringify({ stories: [] }, null, 2));
    }
    const data = JSON.parse(fs.readFileSync(STORY_FILE, 'utf8'));
    return data;
}

function saveStories(data) {
    fs.writeFileSync(STORY_FILE, JSON.stringify(data, null, 2));
}

// Hàm toán học: Tính độ tương đồng giữa 2 vector (Cosine Similarity)
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * AI Gatekeeper & Thuật toán lọc 3 lớp
 */
async function processEventIntoTimeline(clusterId, eventTitle, eventSummary, eventDate, eventCategories = [], eventVector = null, eventUrl = "#") {
    const data = loadStories();
    
    // Chuẩn hóa định dạng danh sách câu chuyện để an toàn khi map
    const storiesArray = data.stories ? data.stories : (Array.isArray(data) ? data : Object.values(data));
    const storiesMap = storiesArray.reduce((acc, s) => { acc[s.id || `story_${Date.now()}`] = s; return acc; }, {});

    // LỚP LỌC 1 & 2: Dùng Code cứng để chặn khác chuyên mục và tính điểm Vector
    const activeStories = Object.keys(storiesMap)
        .filter(id => storiesMap[id].status === 'ONGOING' || storiesMap[id].status === 'ongoing')
        .filter(id => {
            // LỚP 1: LỌC CHUYÊN MỤC
            const storyCategories = storiesMap[id].categories || [];
            if (storyCategories.length === 0 || eventCategories.length === 0) return true;
            return storyCategories.some(c => eventCategories.includes(c));
        })
        .filter(id => {
            // LỚP 2: LỌC VECTOR
            if (!storiesMap[id].main_vector || !eventVector) return true;
            const score = cosineSimilarity(eventVector, storiesMap[id].main_vector);
            return score >= 0.65;
        })
        .map(id => ({
            id: id,
            topic: storiesMap[id].title,
            latest_event: storiesMap[id].timeline && storiesMap[id].timeline.length > 0 
                ? storiesMap[id].timeline[storiesMap[id].timeline.length - 1].title 
                : "N/A"
        }));

    // Hàm tạo Story mới
    const createNewStory = (id, title, desc) => {
        storiesMap[id] = {
            id: id,
            title: title || eventTitle,
            status: 'ongoing',
            first_seen: eventDate,
            last_updated: eventDate,
            categories: eventCategories, 
            main_vector: eventVector,    
            timeline: [{
                time: eventDate ? new Date(eventDate).getTime() : Date.now(),
                title: eventTitle,
                summary: desc || eventSummary,
                topic_id: clusterId,
                url: eventUrl || "#",
                importance: 85
            }]
        };
        logger.info(`[Story Engine] Đã khởi tạo Câu chuyện mới: ${storiesMap[id].title}`);
    };

    // NẾU KHÔNG CÒN ỨNG VIÊN NÀO QUA ĐƯỢC 2 LỚP LỌC -> TẠO MỚI LUÔN, KHÔNG GỌI AI
    if (activeStories.length === 0) {
        const newId = `story_${Date.now().toString(36)}`;
        createNewStory(newId, eventTitle, eventSummary);
        saveStories({ stories: Object.values(storiesMap) });
        return;
    }

    // LỚP 3: AI GATEKEEPER (Chỉ duyệt những ứng viên tiềm năng nhất)
    const prompt = `
Tôi có một TÌNH TIẾT MỚI:
- Tiêu đề: "${eventTitle}"
- Tóm tắt: "${eventSummary}"

Dưới đây là các DÒNG SỰ KIỆN đang theo dõi có khả năng liên quan:
${JSON.stringify(activeStories, null, 2)}

Nhiệm vụ:
Tình tiết mới có phải là diễn biến tiếp theo hoặc chi tiết bổ sung cho Dòng sự kiện nào không?
LỆNH TUYỆT ĐỐI: CHỈ trả về JSON duy nhất với định dạng:
{
  "action": "APPEND" hoặc "NEW",
  "target_id": "điền id của sự kiện nếu APPEND",
  "reason": "Giải thích ngắn gọn"
}`;

    try {
        const aiResponse = await gateway.executeTask('MATCH_TIMELINE', prompt);
        
        let cleanResponse = aiResponse;
        if (typeof aiResponse === 'string') {
            cleanResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        const decision = typeof cleanResponse === 'string' ? JSON.parse(cleanResponse) : cleanResponse;

        if (decision.action === 'APPEND' && decision.target_id && storiesMap[decision.target_id]) {
            const tl = storiesMap[decision.target_id];
            
            // --- 🐛 SỬA LỖI 1 TẠI ĐÂY ---
            tl.timeline.push({
                time: eventDate ? new Date(eventDate).getTime() : Date.now(),
                title: eventTitle,
                summary: eventSummary,
                topic_id: clusterId,
                url: eventUrl || "#",
                importance: 85
            });
            tl.last_updated = eventDate;
            
            logger.info(`[Story Engine] Nối sự kiện vào truyện cũ: ${tl.title} (Lý do: ${decision.reason || 'AI tự quyết định'})`);
        } else {
            const newId = `story_${Date.now().toString(36)}`;
            createNewStory(newId, eventTitle, eventSummary);
        }
    } catch (error) {
        logger.error(`[Story Engine] Lỗi khi gọi AI Gatekeeper: ${error.message}. Tự động Fallback tạo Story mới.`);
        const newId = `story_${Date.now().toString(36)}`;
        createNewStory(newId, eventTitle, eventSummary);
    }

    // Cập nhật lại Database Timeline với định dạng đúng
    saveStories({ stories: Object.values(storiesMap) });
}

module.exports = {
    processEventIntoTimeline
};

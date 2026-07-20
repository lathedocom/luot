const fs = require('fs');
const path = require('path');
const gateway = require('./ai/gateway');
const logger = require('./utils/logger');

// Đổi tên file lưu trữ thành timeline_data.json cho đúng chuẩn Story-centric
const STORY_FILE = path.join(__dirname, '../../data/timeline_data.json');

// Khởi tạo file nếu chưa tồn tại
function loadStories() {
    if (!fs.existsSync(STORY_FILE)) {
        fs.writeFileSync(STORY_FILE, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(STORY_FILE, 'utf8'));
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
    const stories = loadStories();
    
    // LỚP LỌC 1 & 2: Dùng Code cứng để chặn khác chuyên mục và tính điểm Vector
    const activeStories = Object.keys(stories)
        .filter(id => stories[id].status === 'ONGOING')
        .filter(id => {
            // LỚP 1: LỌC CHUYÊN MỤC
            // Nếu bài báo mới và dòng sự kiện cũ không có chung chuyên mục nào -> Loại ngay!
            const storyCategories = stories[id].categories || [];
            if (storyCategories.length === 0 || eventCategories.length === 0) return true; // Bỏ qua nếu thiếu data
            const hasCommonCategory = storyCategories.some(c => eventCategories.includes(c));
            return hasCommonCategory;
        })
        .filter(id => {
            // LỚP 2: LỌC VECTOR
            // Tính độ giống nhau, nếu < 0.65 thì xem như không liên quan -> Loại!
            if (!stories[id].main_vector || !eventVector) return true;
            const score = cosineSimilarity(eventVector, stories[id].main_vector);
            return score >= 0.65;
        })
        .map(id => ({
            id: id,
            topic: stories[id].title,
            latest_event: stories[id].timeline[stories[id].timeline.length - 1].title
        }));

    // Hàm tạo Story mới
    const createNewStory = (id, title, desc) => {
        stories[id] = {
            title: title || eventTitle,
            status: 'ONGOING',
            first_seen: eventDate,
            last_updated: eventDate,
            categories: eventCategories, // Lưu lại chuyên mục để so sánh lần sau
            main_vector: eventVector,    // Lưu lại vector của sự kiện gốc
            timeline: [{
                time: Date.now(), // Lưu chính xác mili-giây để hiển thị giao diện
                title: eventTitle,
                summary: desc || eventSummary,
                topic_id: clusterId,
                url: eventUrl,
                importance: 85
            }]
        };
        logger.info(`[Story Engine] Đã khởi tạo Câu chuyện mới: ${stories[id].title}`);
    };

    // NẾU KHÔNG CÒN ỨNG VIÊN NÀO QUA ĐƯỢC 2 LỚP LỌC -> TẠO MỚI LUÔN, KHÔNG GỌI AI
    if (activeStories.length === 0) {
        const newId = `story_${Date.now().toString(36)}`;
        createNewStory(newId, eventTitle, eventSummary);
        saveStories(stories);
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
1. Tình tiết mới có phải là diễn biến tiếp theo hoặc chi tiết bổ sung cho Dòng sự kiện nào không? (Trả về APPEND và ghi rõ ID).
2. Hay đây là một chủ đề hoàn toàn độc lập? (Trả về NEW_STORY).

CHỈ TRẢ VỀ JSON:
{
  "action": "APPEND" | "NEW_STORY",
  "story_id": "Mã ID (nếu APPEND)",
  "new_title": "Tên bao quát cho câu chuyện này (nếu NEW_STORY)"
}`;

    try {
        logger.info(`[Story Engine] Đang nhờ AI duyệt tình tiết: ${eventTitle}`);
        const decision = await gateway.executeTask('MATCH_TIMELINE', prompt); // Dùng Gemma

        if (decision.action === 'APPEND' && decision.story_id && stories[decision.story_id]) {
            // Lấy event cuối cùng để kiểm tra trùng lặp
            const tl = stories[decision.story_id];
            const lastEvent = tl.timeline[tl.timeline.length - 1];
            
            // Deduplication cơ bản: Nếu tiêu đề quá giống nhau thì không tạo thêm node
            if (lastEvent.title === eventTitle) {
                logger.info(`[Story Engine] Sự kiện trùng lặp, bỏ qua.`);
                return;
            }

            // Thêm mốc thời gian mới
            tl.timeline.push({
                time: Date.now(),
                title: eventTitle,
                summary: eventSummary,
                topic_id: clusterId,
                url: eventUrl,
                importance: 90
            });
            tl.last_updated = eventDate;
            
            // Cập nhật lại vector chính để câu chuyện luôn "bám sát" diễn biến mới nhất
            if (eventVector) tl.main_vector = eventVector; 
            
            logger.info(`[Story Engine] Đã cập nhật tình tiết mới cho: ${tl.title}`);
        } else {
            const newId = `story_${Date.now().toString(36)}`;
            createNewStory(newId, decision.new_title, eventSummary);
        }

        saveStories(stories);
    } catch (error) {
        logger.error(`[Story Engine] Lỗi AI Verifier: ${error.message}. Chuyển sang lưu dự phòng.`);
        const newId = `story_fallback_${Date.now().toString(36)}`;
        createNewStory(newId, eventTitle, eventSummary);
        saveStories(stories);
    }
}

module.exports = { processEventIntoTimeline };

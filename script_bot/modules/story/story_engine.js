const { cosineSimilarity } = require('../topic/similarity_engine');
const { generateShortHash } = require('../utils/hash');
const gateway = require('../ai/gateway');
const logger = require('../utils/logger');
const storyStore = require('./story_store');

async function processTopicIntoStory(newTopic) {
    const db = storyStore.readTimelineData();
    let stories = db.stories || [];

    // 1. Tạo Snapshot siêu nhẹ
    const snapshot = {
        time: newTopic.timestamp,
        title: newTopic.title,
        summary: newTopic.short_summary,
        topic_id: newTopic.event_key,
        importance: newTopic.importance || 50
    };

    if (stories.length === 0) {
        return createNewStory(snapshot, stories, db);
    }

    // 2. Lấy 20 Story được cập nhật gần nhất
    const recentStories = [...stories].sort((a, b) => b.last_updated - a.last_updated).slice(0, 20);

    // 3. Embedding Search: Tìm Top 5 Story giống nhất
    // Lưu ý: Cần thêm trường `main_vector` vào Story khi tạo để so sánh
    const scoredStories = recentStories.map(story => {
        return {
            ...story,
            score: cosineSimilarity(newTopic.vector, story.main_vector)
        };
    }).sort((a, b) => b.score - a.score);

    const top5Stories = scoredStories.slice(0, 5);
    
    // Nếu điểm quá thấp (< 0.4), bỏ qua AI và tạo mới luôn để tiết kiệm Quota
    if (top5Stories[0].score < 0.4) {
        return createNewStory(snapshot, stories, db, newTopic.vector);
    }

    // 4. Gửi AI quyết định
    const prompt = buildStoryPrompt(newTopic, top5Stories);
    
    try {
        // Dùng Gemini Flash Lite vì task này chỉ yêu cầu output JSON rất nhỏ
        const aiDecision = await gateway.executeTask('STORY_MATCHING', prompt); 
        
        if (aiDecision.action === 'append' && aiDecision.story_id) {
            const storyIndex = stories.findIndex(s => s.story_id === aiDecision.story_id);
            if (storyIndex !== -1) {
                // Kiểm tra trùng lặp diễn biến trước khi Append
                const targetStory = stories[storyIndex];
                const lastEvent = targetStory.timeline[targetStory.timeline.length - 1];
                
                if (lastEvent && lastEvent.title === snapshot.title) {
                    logger.info(`[Story Engine] Bỏ qua vì trùng lặp Snapshot: ${snapshot.title}`);
                } else {
                    targetStory.timeline.push(snapshot);
                    targetStory.last_updated = snapshot.time;
                    targetStory.main_vector = newTopic.vector; // Cập nhật vector mới nhất
                    logger.success(`[Story Engine] Đã nối "${snapshot.title}" vào Story: ${targetStory.title}`);
                }
            } else {
                createNewStory(snapshot, stories, db, newTopic.vector);
            }
        } else {
            createNewStory(snapshot, stories, db, newTopic.vector);
        }
    } catch (error) {
        logger.error(`[Story Engine] Lỗi gọi AI, tự động tạo Story mới: ${error.message}`);
        createNewStory(snapshot, stories, db, newTopic.vector);
    }

    storyStore.writeTimelineData(db);
}

function createNewStory(snapshot, stories, db, vector) {
    const newStory = {
        story_id: "story_" + generateShortHash(snapshot.title + snapshot.time),
        title: snapshot.title,
        status: "ongoing",
        first_seen: snapshot.time,
        last_updated: snapshot.time,
        main_vector: vector, 
        timeline: [snapshot]
    };
    stories.push(newStory);
    db.stories = stories;
    logger.success(`[Story Engine] Đã tạo Story mới: ${newStory.title}`);
    return newStory;
}

function buildStoryPrompt(newTopic, candidateStories) {
    const storiesContext = candidateStories.map(s => 
        `ID: ${s.story_id} | Tên chuỗi: ${s.title} | Diễn biến cuối: ${s.timeline[s.timeline.length - 1].title}`
    ).join("\n");

    return `
Bạn là AI quản lý dòng thời gian sự kiện. 
Có một diễn biến (Topic) mới vừa xảy ra:
- Tiêu đề: ${newTopic.title}
- Tóm tắt: ${newTopic.short_summary}

Đây là top các chuỗi sự kiện (Story) đang diễn ra:
${storiesContext}

Diễn biến mới này có phải là tình tiết tiếp theo của một trong các Story trên không?
LỆNH TUYỆT ĐỐI: CHỈ TRẢ VỀ JSON:
- Nếu thuộc về: {"action": "append", "story_id": "ID_của_story", "reason": "Lý do ngắn"}
- Nếu là sự kiện mới hoàn toàn: {"action": "new_story", "reason": "Lý do ngắn"}
    `;
}

module.exports = { processTopicIntoStory };

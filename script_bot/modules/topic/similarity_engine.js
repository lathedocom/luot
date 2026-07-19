const logger = require('../utils/logger');
const topicStore = require('./topic_store');

/**
 * Công thức toán học đo khoảng cách giữa 2 vector
 */
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
 * Đánh giá một Cụm bài báo mới so với Database cũ
 * Trả về Action quyết định luồng đi tiếp theo của Pipeline
 */
function evaluateClusterAction(newClusterVector, existingTopics) {
    let bestMatch = null;
    let highestScore = 0;

    // Quét toàn bộ Topic trong lịch sử để tìm điểm giống nhất
    for (const topic of existingTopics) {
        if (!topic.main_vector) continue;
        const score = cosineSimilarity(newClusterVector, topic.main_vector);
        if (score > highestScore) {
            highestScore = score;
            bestMatch = topic;
        }
    }

    let action = 'CREATE_NEW'; // Mặc định < 0.72

    if (highestScore >= 0.98) {
        action = 'SKIP'; // Giống y hệt, không cần làm gì
    } else if (highestScore >= 0.95) {
        action = 'MERGE'; // Rất giống, chỉ gộp link bài báo mới vào nguồn, không gọi AI
    } else if (highestScore >= 0.85) {
        action = 'LIGHT_UPDATE'; // Giống, gọi AI nhẹ cập nhật thêm Timeline
    } else if (highestScore >= 0.72) {
        action = 'VERIFY_BY_AI'; // Hơi giống, cần AI xác minh xem có phải chung sự kiện không
    }

    return { action, bestMatch, score: highestScore };
}

module.exports = { evaluateClusterAction, cosineSimilarity };

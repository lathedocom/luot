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

   let action = 'CREATE_NEW'; // Mặc định < 0.60
    
    if (highestScore >= 0.95) {
        action = 'SKIP'; // Giống y hệt (Trùng lặp báo)
    } else if (highestScore >= 0.80) { // HẠ TỪ 0.95 XUỐNG 0.80
        action = 'MERGE'; // Rất giống, cùng 1 chuỗi sự kiện sát sườn
    } else if (highestScore >= 0.70) { // HẠ TỪ 0.85 XUỐNG 0.70
        action = 'LIGHT_UPDATE'; // Cùng 1 chủ đề vĩ mô (vd: Nga-Ukraine)
    } else if (highestScore >= 0.60) {
        action = 'VERIFY_BY_AI'; 
    }

    return { action, bestMatch, score: highestScore };
}

module.exports = { evaluateClusterAction, cosineSimilarity };

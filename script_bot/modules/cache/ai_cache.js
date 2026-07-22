const { getCache, setCache } = require('./cache_manager');

function getAiResult(topicKey) {
    // Gọi TTL cực lớn (10 năm) vì kết quả AI của một tình tiết là vĩnh viễn không đổi
    return getCache('ai_cache', topicKey);
}

function saveAiResult(topicKey, resultData) {
  // Lưu với TTL = 30 ngày, đủ để cache trong vòng đời hoạt động của 1 topic
  setCache('ai_cache', topicKey, resultData, 43200, '4.5');
}

module.exports = { getAiResult, saveAiResult };

const { getCache, setCache } = require('./cache_manager');

function getAiResult(topicKey) {
    // Gọi TTL cực lớn (10 năm) vì kết quả AI của một tình tiết là vĩnh viễn không đổi
    return getCache('ai_cache', topicKey);
}

function saveAiResult(topicKey, resultData) {
    // Lưu với TTL = 5256000 phút (10 năm)
    setCache('ai_cache', topicKey, resultData, 5256000, '4.5');
}

module.exports = { getAiResult, saveAiResult };

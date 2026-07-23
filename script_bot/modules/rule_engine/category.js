const { CATEGORIES } = require('../../config/categories');

// Hàm lọc bài viết giả định/xã luận để tránh AI hallucination
function isHypotheticalOrOpinion(text) {
    const skipKeywords = [
        "what if", "hypothetical", "opinion", "editorial", "column",
        "nếu", "giả sử", "kịch bản", "góc nhìn", "bình luận", "quan điểm"
    ];
    const lowerText = text.toLowerCase();
    return skipKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Gán nhãn chuyên mục (Multi-label) dựa vào từ khóa trong văn bản.
 * Một bài báo có thể thuộc nhiều chuyên mục.
 */
function extractCategories(text) {
    if (!text) return ['uncategorized'];
    
    if (isHypotheticalOrOpinion(text)) {
        return ['opinion_analysis'];
    }
    
    const lowerText = text.toLowerCase();
    const matched = [];
    
    for (const cat of CATEGORIES) {
        for (const kw of cat.keywords) {
            if (lowerText.includes(kw.toLowerCase())) {
                matched.push(cat.id);
                break; 
            }
        }
    }
    
    return matched.length > 0 ? matched : ['uncategorized'];
}

/**
 * Lấy điểm tin cậy trung bình của cả cụm (Dựa vào uy tín nguồn)
 */
function getClusterCredibility(cluster) {
    if (!cluster.articles || cluster.articles.length === 0) return 5;
    const scores = cluster.articles.map(a => a.source_credibility || 5);
    const sum = scores.reduce((acc, val) => acc + val, 0);
    return Number((sum / scores.length).toFixed(1));
}

module.exports = { extractCategories, isHypotheticalOrOpinion, getClusterCredibility };

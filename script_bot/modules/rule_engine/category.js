// FILE: script_bot/modules/rule_engine/category.js
const { CATEGORIES } = require('../../config/categories');

// Hàm hỗ trợ: Khớp từ khóa chính xác hỗ trợ Unicode Tiếng Việt
function matchCount(text, keyword) {
    if (!text) return 0;
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Sử dụng \p{L} để nhận diện đúng ranh giới từ Tiếng Việt (thay vì \b hay bị lỗi)
    // Cờ 'giu' (Global, Case-insensitive, Unicode)
    const pattern = new RegExp(`(^|[^\\p{L}])${escaped}([^\\p{L}]|$)`, 'giu');
    const matches = text.match(pattern);
    
    return matches ? matches.length : 0;
}

// Hàm lọc bài viết giả định/xã luận để tránh AI hallucination
function isHypotheticalOrOpinion(text) {
    const skipKeywords = [
        "what if", "hypothetical", "opinion", "editorial", "column",
        "nếu", "giả sử", "kịch bản", "góc nhìn", "bình luận", "quan điểm"
    ];
    // Đếm xem có dính từ khóa xã luận không (chỉ cần > 0 là chặn)
    return skipKeywords.some(keyword => matchCount(text, keyword) > 0);
}

/**
 * Gán nhãn chuyên mục (Multi-label) bằng Thuật toán chấm điểm.
 * Trả về tối đa 3 chuyên mục có điểm cao nhất.
 */
function extractCategories(text) {
    if (!text) return ['uncategorized'];
    
    // 1. Kiểm tra bộ lọc xã luận
    if (isHypotheticalOrOpinion(text)) {
        return ['opinion_analysis'];
    }
    
    const scores = {};
    
    // 2. Chấm điểm cho từng chuyên mục dựa trên số lần xuất hiện từ khóa
    for (const cat of CATEGORIES) {
        scores[cat.id] = 0;
        for (const kw of cat.keywords) {
            scores[cat.id] += matchCount(text, kw);
        }
    }
    
    // 3. Lọc các chuyên mục có điểm > 0 và sắp xếp giảm dần (cao nhất đứng đầu)
    const matched = Object.keys(scores)
        .filter(id => scores[id] > 0)
        .sort((a, b) => scores[b] - scores[a]);
        
    // 4. Chỉ giữ lại tối đa 3 chuyên mục có điểm cao nhất để tránh làm loãng tag
    const topCategories = matched.slice(0, 3);
    
    return topCategories.length > 0 ? topCategories : ['uncategorized'];
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

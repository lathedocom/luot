const { CATEGORIES } = require('../../config/categories');

// [NEW] Hàm lọc bài viết giả định/xã luận để tránh AI hallucination
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
 * Một bài báo có thể thuộc nhiều chuyên mục (VD: Vừa 'Kinh tế' vừa 'Công nghệ').
 */
function extractCategories(text) {
    if (!text) return ['uncategorized'];
    
    // [NEW] Kiểm tra nếu là bài xã luận/giả định thì gán nhãn riêng, loại khỏi luồng tin chuẩn
    if (isHypotheticalOrOpinion(text)) {
        return ['opinion_analysis'];
    }
    
    const lowerText = text.toLowerCase();
    const matched = [];
    for (const cat of CATEGORIES) {
        for (const kw of cat.keywords) {
            // Nếu văn bản chứa từ khóa của chuyên mục này
            if (lowerText.includes(kw.toLowerCase())) {
                matched.push(cat.id);
                break; // Chỉ cần khớp 1 từ khóa là đủ để nhận diện chuyên mục này
            }
        }
    }
    
    // Nếu không khớp từ khóa nào, gán nhãn mặc định
    return matched.length > 0 ? matched : ['uncategorized'];
}

module.exports = { extractCategories };

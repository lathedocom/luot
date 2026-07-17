const { CATEGORIES } = require('../../config/categories');

/**
 * Gán nhãn chuyên mục (Multi-label) dựa vào từ khóa trong văn bản.
 * Một bài báo có thể thuộc nhiều chuyên mục (VD: Vừa 'Kinh tế' vừa 'Công nghệ').
 */
function extractCategories(text) {
    if (!text) return ['uncategorized'];
    
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

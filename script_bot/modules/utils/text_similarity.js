/**
 * Thuật toán so khớp văn bản Jaccard (Lexical Similarity)
 * Giúp bắt các trường hợp lọt lưới của Vector Embedding mà không tốn Quota AI.
 */

function normalizeTokens(text) {
    if (!text) return new Set();
    return new Set(
        text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
            .replace(/[^\w\s]/g, ' ') // Thay ký tự đặc biệt bằng khoảng trắng
            .split(/\s+/)
            .filter(w => w.length > 2) // Chỉ lấy các từ có nghĩa (bỏ hư từ ngắn)
    );
}

function jaccardSimilarity(textA, textB) {
    const a = normalizeTokens(textA);
    const b = normalizeTokens(textB);
    
    if (a.size === 0 || b.size === 0) return 0;
    
    const intersection = new Set([...a].filter(x => b.has(x)));
    const union = new Set([...a, ...b]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
}

module.exports = { jaccardSimilarity };

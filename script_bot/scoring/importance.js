/**
 * Thuật toán tính điểm Importance (Độ quan trọng) từ 0 đến 100.
 * Không dùng AI, chỉ dùng logic cộng điểm theo mức độ phủ sóng.
 */
function calculateImportance(categories, regions, sourcesCount, isHot = false) {
    let score = 30; // Điểm nền cơ bản cho mọi bản tin

    // 1. Phủ nhiều chuyên mục (Sự kiện có tác động đa ngành)
    if (categories && categories.length > 1) {
        score += (categories.length * 5);
    }

    // 2. Phủ nhiều khu vực (Sự kiện có tầm ảnh hưởng lớn)
    if (regions && regions.includes('global')) {
        score += 20; // Sự kiện toàn cầu luôn quan trọng
    } else if (regions && regions.length > 1) {
        score += (regions.length * 5);
    }

    // 3. Số lượng báo cùng đưa tin (Sự kiện được quan tâm)
    if (sourcesCount && sourcesCount > 1) {
        // Mỗi bài báo cộng 5 điểm, tối đa cộng 30 điểm
        score += Math.min(sourcesCount * 5, 30); 
    }

    // 4. Có gắn mác Sự kiện Nóng từ bước Clustering
    if (isHot) {
        score += 10;
    }

    // Chốt chặn: Đảm bảo điểm luôn nằm trong khoảng 0 đến 100
    return Math.min(Math.max(score, 0), 100);
}

module.exports = { calculateImportance };

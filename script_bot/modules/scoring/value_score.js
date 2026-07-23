// script_bot/modules/scoring/value_score.js

function calculateValueScore({ importance, scope, credibilityAvg, matchedPriorityCount, updateCount }) {
    // Lớp 2: Impact (Phạm vi) - Max 100
    const SCOPE_WEIGHT = { personal: 20, business: 50, national: 75, global: 100 };
    const impactScore = SCOPE_WEIGHT[scope?.toLowerCase()] || 30;

    // Lớp 4: Confidence (Độ tin cậy từ RSS) - Max 100
    const confidenceScore = Math.min((credibilityAvg / 10) * 100, 100); 

    // Lớp 5: Relevance (Độ liên quan hồ sơ - số chuyên mục khớp) - Max 100
    const relevanceScore = Math.min(matchedPriorityCount * 25, 100); 

    // Lớp 3: Novelty (Sự kiện có nhiều diễn biến mới) - Bonus max 20
    // Càng nhiều cập nhật, điểm càng tăng nhẹ để đẩy tin lên trên
    const noveltyBonus = updateCount > 1 ? Math.min(updateCount * 3, 20) : 0; 

    // Lớp 1: Importance (Tầm quan trọng) đã được AI hoặc Rule chấm từ 0-100

    // Tổng hợp điểm Value Score
    const finalScore = Math.round(
        (importance * 0.35) +
        (impactScore * 0.25) +
        (confidenceScore * 0.15) +
        (relevanceScore * 0.15) +
        noveltyBonus
    );

    return Math.min(finalScore, 100); // Đảm bảo điểm không vượt quá 100
}

module.exports = { calculateValueScore };

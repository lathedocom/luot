const logger = require('./utils/logger');

/**
 * Tạo đồ thị mạng lưới kết nối các thực thể (Nodes & Edges) bằng logic đồng xuất hiện.
 * Nếu 2 thực thể cùng nằm trong 1 bài báo -> Bắt tay nhau tạo thành 1 Edge.
 */
function buildRuleBasedGraph(entities) {
    if (!entities || entities.length < 2) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];

    // 1. Tạo Nodes (Các điểm trên bản đồ)
    entities.forEach(entity => {
        nodes.push({ id: entity, label: entity });
    });

    // 2. Tạo Edges (Đường nối giữa các điểm)
    // Nối thực thể đầu tiên (nhân vật chính) với tất cả các thực thể còn lại
    const mainEntity = entities[0];
    
    for (let i = 1; i < entities.length; i++) {
        edges.push({
            source: mainEntity,
            target: entities[i],
            weight: 1 // Trọng số cơ bản
        });
    }

    return { nodes, edges };
}

module.exports = { buildRuleBasedGraph };

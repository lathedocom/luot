const logger = require('./utils/logger');
const { generateShortHash } = require('./utils/hash');

/**
 * Xây dựng đồ thị tri thức chuẩn định dạng cấu trúc Cytoscape.js
 * Chấp nhận mảng entities dạng object { name, type } hoặc chuỗi (để tương thích ngược).
 */
function buildRuleBasedGraph(entities, eventKey = null) {
    const nodes = [];
    const edges = [];

    if (!entities || entities.length < 2) return { nodes, edges };

    // 1. Chuẩn hóa dữ liệu đầu vào
    // Nếu đầu vào là chuỗi string (code cũ), ta bọc nó lại thành object có type để chờ UI tô màu
    const normalizedEntities = entities.map(e => {
        if (typeof e === 'string') return { name: e, type: 'Unknown' };
        return e;
    });

    // 2. KHỞI TẠO NODES (CÁC NÚT) CHUẨN CYTOSCAPE
    normalizedEntities.forEach(entity => {
        const nodeId = `node_${generateShortHash(entity.name)}`;
        
        // Tránh đẩy trùng node vào mảng
        if (!nodes.some(n => n.data.id === nodeId)) {
            nodes.push({
                data: {
                    id: nodeId,
                    label: entity.name,
                    type: entity.type // Phục vụ Frontend gán icon: Person, Org, Location
                }
            });
        }
    });

    // 3. KHỞI TẠO EDGES (CÁC CẠNH NỐI) CHUẨN CYTOSCAPE
    const mainEntity = normalizedEntities[0];
    const sourceId = `node_${generateShortHash(mainEntity.name)}`;

    for (let i = 1; i < normalizedEntities.length; i++) {
        const targetId = `node_${generateShortHash(normalizedEntities[i].name)}`;
        
        // Ngăn chặn tạo cạnh tự trỏ vào chính nó
        if (sourceId !== targetId) {
            edges.push({
                data: {
                    id: `edge_${sourceId}_${targetId}_${eventKey || Date.now()}`,
                    source: sourceId,
                    target: targetId,
                    label: 'Liên quan',         // Tạm thời để mặc định cho MVP
                    relation_type: 'neutral',   // Phục vụ Frontend tô màu cạnh (🟢 🔴 🟡)
                    weight: 1
                }
            });
        }
    }

    return { nodes, edges };
}

module.exports = { buildRuleBasedGraph };

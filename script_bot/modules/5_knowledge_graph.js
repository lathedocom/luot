const logger = require('./utils/logger');
const { generateShortHash } = require('./utils/hash');

function buildRuleBasedNodes(entities) {
    const nodes = [];
    const normalizedEntities = entities.map(e => {
        if (typeof e === 'string') return { name: e, type: 'Unknown' };
        if (typeof e === 'object' && e !== null) return { name: e.name || 'Unknown', type: e.type || 'Unknown' };
        return { name: String(e), type: 'Unknown' };
    }).filter(e => e.name !== 'Unknown' && e.name.length > 0);

    normalizedEntities.forEach(entity => {
        const nodeId = `node_${generateShortHash(entity.name)}`;
        nodes.push({ data: { id: nodeId, label: entity.name, type: entity.type } });
    });
    return nodes;
}

function buildGlobalGraph(allTopics) {
    const globalNodes = new Map();
    const globalEdges = new Map();

    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const recentTopics = allTopics.filter(t => (now - (t.timestamp || 0)) <= SEVEN_DAYS);

    recentTopics.forEach(topic => {
        if (!topic.entities || topic.entities.length < 2) return;
        
        // 1. Tạo Nodes
        const nodes = buildRuleBasedNodes(topic.entities);
        nodes.forEach(n => {
            if (!globalNodes.has(n.data.id)) globalNodes.set(n.data.id, n);
        });

       // 2. Tạo Edges (Dùng dữ liệu AI nếu có, nếu không thì tự nối mặc định)
        if (topic.entity_relations && topic.entity_relations.length > 0) {
            topic.entity_relations.forEach(rel => {
                const sourceId = `node_${generateShortHash(rel.source)}`;
                const targetId = `node_${generateShortHash(rel.target)}`;
                
                if (globalNodes.has(sourceId) && globalNodes.has(targetId) && sourceId !== targetId) {
                    const edgeKey = `${sourceId}_${targetId}_${rel.relation_type}`;
                    const reverseEdgeKey = `${targetId}_${sourceId}_${rel.relation_type}`;
                    
                    // Thuật toán cộng dồn trọng số
                    if (globalEdges.has(edgeKey)) {
                        globalEdges.get(edgeKey).data.weight += 1;
                    } else if (globalEdges.has(reverseEdgeKey) && rel.relation_type !== 'cause_effect') {
                        // Nếu là quan hệ 2 chiều (không phải mũi tên nhân quả), tăng điểm chiều ngược lại
                        globalEdges.get(reverseEdgeKey).data.weight += 1;
                    } else {
                        globalEdges.set(edgeKey, {
                            data: {
                                id: `edge_${generateShortHash(edgeKey + topic.event_key)}`,
                                source: sourceId,
                                target: targetId,
                                label: rel.label || '',
                                relation_type: rel.relation_type || 'neutral',
                                weight: 2 // Khởi tạo trọng số cơ bản
                            }
                        });
                    }
                }
            });
        } else {
            // [Dự phòng] Nối thực thể chính với các thực thể phụ
            const sourceId = nodes[0].data.id;
            for (let i = 1; i < nodes.length; i++) {
                const targetId = nodes[i].data.id;
                if (sourceId !== targetId) {
                    const edgeKey = `${sourceId}_${targetId}_neutral`;
                    const reverseEdgeKey = `${targetId}_${sourceId}_neutral`;
                    
                    if (globalEdges.has(edgeKey)) {
                        globalEdges.get(edgeKey).data.weight += 0.5; // Tăng nhẹ trọng số
                    } else if (globalEdges.has(reverseEdgeKey)) {
                        globalEdges.get(reverseEdgeKey).data.weight += 0.5;
                    } else {
                        globalEdges.set(edgeKey, {
                            data: { id: `edge_${generateShortHash(edgeKey)}`, source: sourceId, target: targetId, label: 'Liên quan', relation_type: 'neutral', weight: 1 }
                        });
                    }
                }
            }
        }
    });

    return {
        nodes: Array.from(globalNodes.values()),
        edges: Array.from(globalEdges.values())
    };
}

module.exports = { buildGlobalGraph };

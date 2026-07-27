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

// ... (Phần code buildRuleBasedNodes giữ nguyên ở trên)

function buildGlobalGraph(allTopics) {
    const globalNodes = new Map();
    const globalEdges = new Map();

    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const recentTopics = allTopics.filter(t => (now - (t.timestamp || 0)) <= SEVEN_DAYS);

    recentTopics.forEach(topic => {
        if (!topic.entities || topic.entities.length < 2) return;
        
        // --- TÍNH TOÁN XU HƯỚNG SỰ KIỆN ---
        // Suy giảm 2 điểm mỗi giờ. Tối đa 100 (rất nóng), tối thiểu 0 (đã nguội)
        const topicAgeHours = (now - (topic.timestamp || now)) / (1000 * 60 * 60);
        let topicTrend = Math.max(0, 100 - (topicAgeHours * 1.5)); 
        
        // 1. Tạo Nodes và Bơm Dữ liệu Tình báo (Risk & Trend)
        const nodes = buildRuleBasedNodes(topic.entities);
        nodes.forEach(n => {
            if (!globalNodes.has(n.data.id)) {
                // Khởi tạo Node mới với dữ liệu phân tích
                n.data.trend_score = topicTrend;
                n.data.mention_count = 1;
                n.data.risk_profile = {};
                globalNodes.set(n.data.id, n);
            } else {
                // Cập nhật Node đã có: Lấy độ nóng cao nhất và cộng dồn số lần nhắc
                let existingNode = globalNodes.get(n.data.id);
                existingNode.data.trend_score = Math.max(existingNode.data.trend_score, topicTrend);
                existingNode.data.mention_count += 1;
            }

            // Cộng dồn Hồ sơ rủi ro dựa trên chuyên mục của bài báo
            let currentNode = globalNodes.get(n.data.id);
            if (topic.categories && topic.categories.length > 0) {
                topic.categories.forEach(cat => {
                    currentNode.data.risk_profile[cat] = (currentNode.data.risk_profile[cat] || 0) + 1;
                });
            }
        });

        
       // 2. Tạo Edges (Dùng dữ liệu AI nếu có, nếu không thì tự nối mặc định)
        if (topic.entity_relations && topic.entity_relations.length > 0) {
            topic.entity_relations.forEach(rel => {
                const sourceId = `node_${generateShortHash(rel.source)}`;
                const targetId = `node_${generateShortHash(rel.target)}`;
                
                if (globalNodes.has(sourceId) && globalNodes.has(targetId) && sourceId !== targetId) {
                    const edgeKey = `${sourceId}_${targetId}_${rel.relation_type}`;
                    const reverseEdgeKey = `${targetId}_${sourceId}_${rel.relation_type}`;
                    
                    let targetEdgeKey = edgeKey;
                    if (globalEdges.has(reverseEdgeKey) && rel.relation_type !== 'cause_effect') {
                        targetEdgeKey = reverseEdgeKey;
                    }

                    if (globalEdges.has(targetEdgeKey)) {
                        let existingEdge = globalEdges.get(targetEdgeKey);
                        existingEdge.data.weight += 1;
                        // [MỚI] Thêm sự kiện hiện tại vào mảng bằng chứng nếu chưa có
                        if (!existingEdge.data.supporting_events.includes(topic.event_key)) {
                            existingEdge.data.supporting_events.push(topic.event_key);
                        }
                    } else {
                        globalEdges.set(targetEdgeKey, {
                            data: {
                                id: `edge_${generateShortHash(targetEdgeKey + topic.event_key)}`,
                                source: sourceId,
                                target: targetId,
                                label: rel.label || '',
                                relation_type: rel.relation_type || 'neutral',
                                weight: 2,
                                // [MỚI] Lưu lại mã sự kiện để làm "Bằng chứng" cho giao diện
                                supporting_events: [topic.event_key]
                            }
                        });
                    }
                }
            });
        } else {
            // [Dự phòng] Nối thực thể chính với phụ
            const sourceId = nodes[0].data.id;
            for (let i = 1; i < nodes.length; i++) {
                const targetId = nodes[i].data.id;
                if (sourceId !== targetId) {
                    const edgeKey = `${sourceId}_${targetId}_neutral`;
                    const reverseEdgeKey = `${targetId}_${sourceId}_neutral`;
                    
                    if (globalEdges.has(edgeKey)) globalEdges.get(edgeKey).data.weight += 0.5;
                    else if (globalEdges.has(reverseEdgeKey)) globalEdges.get(reverseEdgeKey).data.weight += 0.5;
                    else {
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

module.exports = { buildRuleBasedNodes, buildGlobalGraph };

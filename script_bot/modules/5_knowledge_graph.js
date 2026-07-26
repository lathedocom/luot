const logger = require('./utils/logger');
const { generateShortHash } = require('./utils/hash');

function buildRuleBasedGraph(entities, eventKey = null) {
    const nodes = [];
    const edges = [];

    if (!entities || entities.length < 2) return { nodes, edges };

    // Chuẩn hóa dữ liệu đầu vào an toàn
    const normalizedEntities = entities.map(e => {
        if (typeof e === 'string') return { name: e, type: 'Unknown' };
        if (typeof e === 'object' && e !== null) return { name: e.name || 'Unknown', type: e.type || 'Unknown' };
        return { name: String(e), type: 'Unknown' };
    }).filter(e => e.name !== 'Unknown' && e.name.length > 0);

    if (normalizedEntities.length < 2) return { nodes, edges };

    // Tạo Nodes
    normalizedEntities.forEach(entity => {
        const nodeId = `node_${generateShortHash(entity.name)}`;
        if (!nodes.some(n => n.data.id === nodeId)) {
            nodes.push({
                data: {
                    id: nodeId,
                    label: entity.name,
                    type: entity.type
                }
            });
        }
    });

    // Tạo Edges
    const mainEntity = normalizedEntities[0];
    const sourceId = `node_${generateShortHash(mainEntity.name)}`;

    for (let i = 1; i < normalizedEntities.length; i++) {
        const targetId = `node_${generateShortHash(normalizedEntities[i].name)}`;
        if (sourceId !== targetId) {
            edges.push({
                data: {
                    id: `edge_${sourceId}_${targetId}_${eventKey || Date.now()}`,
                    source: sourceId,
                    target: targetId,
                    label: 'Liên quan',
                    relation_type: 'neutral',
                    weight: 1
                }
            });
        }
    }

    return { nodes, edges };
}

function buildGlobalGraph(allTopics) {
    const globalNodes = new Map();
    const globalEdges = new Map();

    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const recentTopics = allTopics.filter(t => (now - (t.timestamp || 0)) <= SEVEN_DAYS);

    recentTopics.forEach(topic => {
        if (!topic.entities || topic.entities.length < 2) return;
        
        const { nodes, edges } = buildRuleBasedGraph(topic.entities, topic.event_key);
        
        nodes.forEach(n => {
            if (!globalNodes.has(n.data.id)) {
                globalNodes.set(n.data.id, n);
            }
        });

        edges.forEach(e => {
            const edgeKey = `${e.data.source}_${e.data.target}`;
            const reverseEdgeKey = `${e.data.target}_${e.data.source}`;
            
            if (!globalEdges.has(edgeKey) && !globalEdges.has(reverseEdgeKey)) {
                globalEdges.set(edgeKey, e);
            }
        });
    });

    return {
        nodes: Array.from(globalNodes.values()),
        edges: Array.from(globalEdges.values())
    };
}

module.exports = { buildRuleBasedGraph, buildGlobalGraph };

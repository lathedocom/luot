// FILE: assets/js/ui-graph.js

import { getGlobalNewsData } from './api.js';
import { escapeHtml } from './utils.js';

// Đăng ký plugin Dagre với Cytoscape
if (typeof cytoscape !== 'undefined' && typeof cytoscapeDagre !== 'undefined') {
    cytoscape.use(cytoscapeDagre);
}
let cyInstance = null;
let savedGraphData = null;

export function renderKnowledgeGraph(graphData) {
    savedGraphData = graphData;
    const cyContainer = document.getElementById('cy-container');
    
    if (!cyContainer || !savedGraphData || !savedGraphData.nodes || savedGraphData.nodes.length === 0) {
        if (cyContainer) {
            cyContainer.innerHTML = '<p style="padding: 20px; opacity: 0.7; text-align: center;">Chưa có đủ dữ liệu thực thể để tạo Mạng lưới tri thức.</p>';
        }
        return;
    }

    const resizeObserver = new ResizeObserver(() => {
        if (cyContainer.offsetWidth > 0 && cyContainer.offsetHeight > 0) {
            if (!cyInstance) {
                initCy(cyContainer);
            } else {
                cyInstance.resize();
                cyInstance.fit();
            }
        }
    });
    resizeObserver.observe(cyContainer);
}

function initCy(container) {
    container.innerHTML = ''; 

    const typeColors = {
        'Person': '#3b82f6',       // Xanh dương
        'Organization': '#f59e0b', // Vàng cam
        'Location': '#10b981',     // Xanh lá
        'Unknown': '#64748b'       // Xám
    };

    cyInstance = cytoscape({
        container: container,
        elements: {
            nodes: savedGraphData.nodes,
            edges: savedGraphData.edges
        },
        style: [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'background-color': function(ele){ return typeColors[ele.data('type')] || typeColors['Unknown']; },
                    'color': '#ffffff',
                    'text-outline-color': '#0f172a',
                    'text-outline-width': 2,
                    'font-size': function(ele) {
                        const mentions = ele.data('mention_count') || 1;
                        const size = 11 + Math.min(8, mentions * 1.5); 
                        return `${size}px`;
                    },
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'width': function(ele) {
                        const mentions = ele.data('mention_count') || 1;
                        const degree = ele.degree();
                        const baseSize = 40;
                        return `${baseSize + (mentions * 10) + (degree * 5)}px`;
                    },
                    'height': function(ele) {
                        const mentions = ele.data('mention_count') || 1;
                        const degree = ele.degree();
                        const baseSize = 40;
                        return `${baseSize + (mentions * 10) + (degree * 5)}px`;
                    },
                    'padding': '10px',
                    'shape': 'round-rectangle',
                    'transition-property': 'width, height, background-color',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': function(ele) { 
                        const weight = ele.data('weight') || 1;
                        return Math.min(8, Math.max(2, weight * 1.5)); 
                    },
                    'curve-style': 'bezier',
                    'opacity': 0.8,
                    'label': 'data(label)',
                    'font-size': '10px',
                    'color': '#94a3b8',
                    'text-rotation': 'autorotate',
                    'text-background-opacity': 1,
                    'text-background-color': '#0f172a',
                    'text-background-padding': '3px',
                    'transition-property': 'opacity',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: 'edge[relation_type = "cooperation"]',
                style: { 'line-color': '#10b981', 'line-style': 'dashed' }
            },
            {
                selector: 'edge[relation_type = "conflict"]',
                style: { 'line-color': '#ef4444' }
            },
            {
                selector: 'edge[relation_type = "cause_effect"]',
                style: { 'line-color': '#f59e0b', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#f59e0b' }
            },
            {
                selector: 'edge[relation_type = "neutral"]',
                style: { 'line-color': '#475569' }
            },
            {
                selector: '.faded',
                style: {
                    'opacity': 0.1,
                    'text-opacity': 0.1
                }
            }
        ],
        layout: {
            name: 'cose',
            animate: false,
            nodeRepulsion: function(node){ return 2048; },
            idealEdgeLength: function(edge){ return 64; },
            edgeElasticity: function(edge){ return 32; }
        }
    });

    cyInstance.ready(() => {
        cyInstance.resize();
        cyInstance.fit();

        // =================================================================
        // THUẬT TOÁN PAGERANK - TÍNH ĐIỂM INFLUENCE SCORE
        // =================================================================
        const pageRank = cyInstance.elements().pageRank({ dampingFactor: 0.85 });
        
        const rankedNodes = cyInstance.nodes().map(node => {
            const score = pageRank.rank(node);
            node.data('influence_score', score);
            return {
                id: node.id(),
                label: node.data('label'),
                score: score
            };
        }).sort((a, b) => b.score - a.score);

        const leaderboardList = document.getElementById('leaderboard-list');
        if (leaderboardList && rankedNodes.length > 0) {
            let html = '';
            const top5 = rankedNodes.slice(0, 5);
            const maxScore = top5[0].score;
            
            top5.forEach((item, index) => {
                let rankColor = index === 0 ? '#facc15' : (index === 1 ? '#cbd5e1' : (index === 2 ? '#b45309' : '#3b82f6'));
                const percent = Math.max(5, (item.score / maxScore) * 100);
                
                html += `
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #f8fafc;">
                            <span style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">
                                <span style="color: ${rankColor}; font-weight: 900; margin-right: 6px; font-size: 14px;">#${index + 1}</span> ${escapeHtml(item.label)}
                            </span>
                            <span style="opacity: 0.7; font-size: 12px; font-weight: bold;">${(item.score * 100).toFixed(1)}</span>
                        </div>
                        <div style="width: 100%; background: rgba(255,255,255,0.1); height: 4px; border-radius: 2px; overflow: hidden;">
                            <div style="width: ${percent}%; background: ${rankColor}; height: 100%; border-radius: 2px;"></div>
                        </div>
                    </div>
                `;
            });
            leaderboardList.innerHTML = html;
        }
    });

    // Bắt sự kiện Click ra nền trống để bỏ focus
    cyInstance.on('tap', function(evt){
        if (evt.target === cyInstance) {
            cyInstance.elements().removeClass('faded');
        }
    });

    // =================================================================
    // PHỤC HỒI: Xử lý sự kiện Click vào Node -> Hiện thông tin Thực thể
    // =================================================================
    cyInstance.on('tap', 'node', function(evt){
        const node = evt.target;
        const nodeLabel = node.data('label');
        const nodeType = node.data('type');
        const nodeColor = typeColors[nodeType] || typeColors['Unknown'];

        cyInstance.elements().addClass('faded');
        node.neighborhood().add(node).removeClass('faded');

        const trendScore = Math.round(node.data('trend_score') || 0);
        const riskProfile = node.data('risk_profile') || {};
        const rawInfluence = node.data('influence_score') || 0;
        const influenceScore = (rawInfluence * 100).toFixed(1);

        const allNews = getGlobalNewsData();
        const relatedEvents = allNews.filter(topic => {
            if (!topic.entities) return false;
            return topic.entities.some(e => {
                const entityName = typeof e === 'object' ? (e.name || '') : String(e);
                return entityName.toLowerCase() === nodeLabel.toLowerCase();
            });
        });

        if (relatedEvents.length === 0) return;
        relatedEvents.sort((a, b) => b.timestamp - a.timestamp);

        const connectedNodes = node.neighborhood('node');
        let relatedEntitiesHtml = '';
        if (connectedNodes.length > 0) {
            connectedNodes.forEach(n => {
                const nColor = typeColors[n.data('type')] || typeColors['Unknown'];
                relatedEntitiesHtml += `<span style="display:inline-flex; align-items:center; padding: 4px 12px; margin: 0 8px 8px 0; background: ${nColor}15; color: ${nColor}; border: 1px solid ${nColor}40; border-radius: 16px; font-size: 13px; font-weight: 500;">${escapeHtml(n.data('label'))}</span>`;
            });
        }

        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        document.getElementById('modal-reliability').innerHTML = '';
        document.getElementById('modal-mini-timeline').style.display = 'none';
        document.getElementById('toggle-sources-btn').style.display = 'none';
        document.getElementById('modal-sources').style.display = 'none';

        modalTitle.innerHTML = `<span style="color:${nodeColor}">Thực thể: ${escapeHtml(nodeLabel)}</span>`;

        let trendHtml = '';
        if (trendScore > 75) trendHtml = `<span style="color: #ef4444; font-weight:bold;">↑ ${trendScore}% (Đang cực nóng)</span>`;
        else if (trendScore > 40) trendHtml = `<span style="color: #f59e0b; font-weight:bold;">→ ${trendScore}% (Ổn định)</span>`;
        else trendHtml = `<span style="color: #10b981; font-weight:bold;">↓ ${trendScore}% (Đã hạ nhiệt)</span>`;

        const influenceHtml = `<span style="color: var(--md-sys-color-primary); font-weight:bold;">★ ${influenceScore} điểm (PageRank)</span>`;

        let riskHtml = '';
        const categoryLabels = { military: 'Quân sự / Xung đột', economy: 'Kinh tế', politics: 'Chính trị', finance: 'Tài chính', tech: 'Công nghệ', law: 'Pháp luật' };
        
        if (Object.keys(riskProfile).length > 0) {
            for (let cat in riskProfile) {
                if (categoryLabels[cat]) {
                    const barWidth = Math.min(100, riskProfile[cat] * 25); 
                    riskHtml += `
                    <div style="margin-bottom: 8px; display: flex; align-items: center; font-size: 13px;">
                        <span style="width: 130px; display: inline-block; opacity: 0.8;">${categoryLabels[cat]}</span>
                        <div style="flex-grow: 1; background: var(--md-sys-color-background); height: 10px; border-radius: 4px; overflow: hidden; border: 1px solid var(--md-sys-color-outline);">
                            <div style="width: ${barWidth}%; background: ${nodeColor}; height: 100%; transition: width 0.5s ease;"></div>
                        </div>
                    </div>`;
                }
            }
        } else {
            riskHtml = '<p style="font-size: 13px; opacity: 0.6; margin: 0;">Chưa ghi nhận rủi ro cụ thể.</p>';
        }

        let listHtml = '';
        relatedEvents.forEach((item, index) => {
            const timeObj = new Date(item.timestamp);
            const timeString = `${timeObj.getHours().toString().padStart(2,'0')}:${timeObj.getMinutes().toString().padStart(2,'0')} - ${timeObj.toLocaleDateString('vi-VN')}`;
            const borderStyle = index === relatedEvents.length - 1 ? '' : 'border-bottom: 1px dashed var(--md-sys-color-outline); margin-bottom: 16px; padding-bottom: 16px;';
            listHtml += `
                <div style="${borderStyle}">
                    <div style="font-size: 12px; opacity: 0.7; margin-bottom: 6px;">${timeString}</div>
                    <h4 style="margin: 0 0 6px 0; font-size: 15px; color: var(--md-sys-color-on-surface); line-height: 1.4;">${escapeHtml(item.title || item.cluster_title)}</h4>
                    <p style="font-size: 14px; opacity: 0.8; margin: 0; line-height: 1.5;">${escapeHtml(item.short_summary)}</p>
                </div>
            `;
        });

        modalBody.innerHTML = `
            <div style="background: rgba(0,0,0,0.05); border: 1px solid var(--md-sys-color-outline); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; font-size: 14px;">
                    <div style="flex: 1; min-width: 140px;">
                        <div style="opacity: 0.7; margin-bottom: 4px; font-size: 12px; text-transform: uppercase;">Dự báo xu hướng</div>
                        ${trendHtml}
                    </div>
                    <div style="flex: 1; min-width: 140px;">
                        <div style="opacity: 0.7; margin-bottom: 4px; font-size: 12px; text-transform: uppercase;">Tầm ảnh hưởng vĩ mô</div>
                        ${influenceHtml}
                    </div>
                </div>
                <div style="font-size: 12px; text-transform: uppercase; color: var(--md-sys-color-on-surface); font-weight: bold; margin-bottom: 12px; opacity: 0.6; border-top: 1px dashed var(--md-sys-color-outline); padding-top: 16px;">
                    Chỉ số rủi ro chuyên ngành
                </div>
                ${riskHtml}
            </div>

            ${relatedEntitiesHtml ? `
            <div style="margin-bottom: 20px;">
                <div style="font-size: 12px; text-transform: uppercase; color: var(--md-sys-color-on-surface); font-weight: bold; margin-bottom: 12px; opacity: 0.6;">
                    Có liên quan (Gợi ý đọc tiếp)
                </div>
                <div style="display: flex; flex-wrap: wrap;">
                    ${relatedEntitiesHtml}
                </div>
            </div>` : ''}

            <div style="background: rgba(0,0,0,0.05); border-left: 4px solid ${nodeColor}; padding: 16px; border-radius: 8px;">
                <div style="font-size: 12px; text-transform: uppercase; color: ${nodeColor}; font-weight: bold; margin-bottom: 16px; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 16px;">library_books</span> 
                    Các sự kiện đóng góp (${relatedEvents.length})
                </div>
                ${listHtml}
            </div>
        `;

        document.getElementById('intelligence-modal').classList.add('active');
    });

    // =================================================================
    // Xử lý sự kiện Click vào Cạnh (Edge) -> Hiển thị Mạng lưới bằng chứng
    // =================================================================
    cyInstance.on('tap', 'edge', function(evt){
        const edge = evt.target;
        const edgeLabel = edge.data('label') || '';
        const relationType = edge.data('relation_type');
        const sourceName = edge.source().data('label');
        const targetName = edge.target().data('label');
        
        const supportingEvents = edge.data('supporting_events') || [];

        cyInstance.elements().addClass('faded');
        edge.removeClass('faded');
        edge.source().removeClass('faded');
        edge.target().removeClass('faded');

        const allNews = getGlobalNewsData();
        const relatedEvents = allNews.filter(topic => supportingEvents.includes(topic.event_key));

        const uniqueSources = [];
        const seenSources = new Set();
        
        relatedEvents.forEach(evt => {
            if (evt.sources && Array.isArray(evt.sources)) {
                evt.sources.forEach(src => {
                    if (src.source_name && !seenSources.has(src.source_name)) {
                        seenSources.add(src.source_name);
                        uniqueSources.push(src);
                    }
                });
            }
        });

        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        document.getElementById('modal-reliability').innerHTML = '';
        document.getElementById('modal-mini-timeline').style.display = 'none';
        document.getElementById('toggle-sources-btn').style.display = 'none';
        document.getElementById('modal-sources').style.display = 'none';

        let typeText = 'Liên quan';
        let typeColor = '#64748b'; 
        if (relationType === 'cause_effect') { typeText = 'Nguyên nhân ➔ Kết quả'; typeColor = '#f59e0b'; } 
        else if (relationType === 'cooperation') { typeText = 'Hợp tác'; typeColor = '#10b981'; } 
        else if (relationType === 'conflict') { typeText = 'Xung đột'; typeColor = '#ef4444'; } 

        modalTitle.innerHTML = `<span style="color:${typeColor}; font-size: 16px;">Phân tích: ${escapeHtml(typeText)}</span>`;

        let sourcesHtml = '';
        uniqueSources.forEach(src => {
            sourcesHtml += `<span style="display:inline-flex; align-items:center; gap: 6px; padding: 4px 12px; background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline); border-radius: 16px; font-size: 13px; font-weight: 500; margin: 0 8px 8px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);"><img src="${escapeHtml(src.source_logo || 'https://via.placeholder.com/16')}" width="16" height="16" style="border-radius:50%; background:#fff;"> ${escapeHtml(src.source_name)}</span>`;
        });

        let listHtml = '';
        relatedEvents.forEach(item => {
            listHtml += `
                <div style="border-bottom: 1px dashed var(--md-sys-color-outline); margin-bottom: 12px; padding-bottom: 12px;">
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: var(--md-sys-color-on-surface); line-height: 1.4;">${escapeHtml(item.title || item.cluster_title)}</div>
                    <div style="font-size: 13px; opacity: 0.8; line-height: 1.5;">${escapeHtml(item.short_summary)}</div>
                </div>
            `;
        });

        modalBody.innerHTML = `
            <div style="background: rgba(0,0,0,0.05); border: 1px solid var(--md-sys-color-outline); padding: 20px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: var(--md-sys-color-on-surface); display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap;">
                    <span>${escapeHtml(sourceName)}</span>
                    <span class="material-icons-round" style="color: ${typeColor}; font-size: 24px;">${relationType === 'cause_effect' ? 'east' : 'sync_alt'}</span>
                    <span>${escapeHtml(targetName)}</span>
                </div>
                ${edgeLabel ? `<div style="font-size: 15px; color: ${typeColor}; margin-top: 12px; font-style: italic;">"${escapeHtml(edgeLabel)}"</div>` : ''}
            </div>

            <div style="margin-bottom: 24px;">
                <div style="font-size: 12px; text-transform: uppercase; font-weight: bold; margin-bottom: 12px; opacity: 0.6; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 16px;">verified_user</span> 
                    Bằng chứng xác nhận (${uniqueSources.length} nguồn báo chí)
                </div>
                <div style="display: flex; flex-wrap: wrap;">
                    ${sourcesHtml || '<span style="font-size:13px; opacity:0.6; font-style: italic;">(Quan hệ do AI tổng hợp suy luận)</span>'}
                </div>
            </div>

            <div style="background: rgba(0,0,0,0.05); border-left: 4px solid ${typeColor}; padding: 16px; border-radius: 8px;">
                <div style="font-size: 12px; text-transform: uppercase; color: ${typeColor}; font-weight: bold; margin-bottom: 16px; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 16px;">format_list_bulleted</span> 
                    Sự kiện hình thành nên kết nối này (${relatedEvents.length})
                </div>
                ${listHtml || '<div style="font-size:13px; opacity:0.6;">Không có dữ liệu bài viết chi tiết.</div>'}
            </div>
        `;

        document.getElementById('intelligence-modal').classList.add('active');
    });
}

// ====================================================================
// KHỞI TẠO THANH CÔNG CỤ ĐIỀU KHIỂN ĐỒ THỊ
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('cy-search-input');
    const filterSelect = document.getElementById('cy-filter-edge');
    const resetBtn = document.getElementById('cy-reset-btn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (!cyInstance) return;
            const term = e.target.value.toLowerCase().trim();
            
            if (!term) {
                cyInstance.elements().removeClass('faded');
                return;
            }

            cyInstance.batch(() => {
                cyInstance.elements().addClass('faded');
                
                const matchedNodes = cyInstance.nodes().filter(node => {
                    const label = node.data('label') || '';
                    return label.toLowerCase().includes(term);
                });

                matchedNodes.removeClass('faded');
                matchedNodes.neighborhood().removeClass('faded');
            });
        });
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            if (!cyInstance) return;
            const type = e.target.value;

            cyInstance.batch(() => {
                if (type === 'all') {
                    cyInstance.edges().style('display', 'element'); 
                } else {
                    cyInstance.edges().style('display', 'none');
                    cyInstance.edges(`[relation_type = "${type}"]`).style('display', 'element');
                }
            });
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (!cyInstance) return;
            if (searchInput) searchInput.value = '';
            if (filterSelect) filterSelect.value = 'all';
            
            cyInstance.batch(() => {
                cyInstance.elements().removeClass('faded');
                cyInstance.edges().style('display', 'element');
                cyInstance.layout(cyInstance.options().layout).run();
            });
        });
    }

    const layoutBtn = document.getElementById('cy-layout-btn');
    if (layoutBtn) {
        layoutBtn.addEventListener('click', () => {
            if (!cyInstance) return;
            const currentLayout = layoutBtn.getAttribute('data-layout');
            
            if (currentLayout === 'cose') {
                cyInstance.layout({
                    name: 'dagre',
                    rankDir: 'TB', 
                    animate: true,
                    animationDuration: 600,
                    nodeSep: 60, 
                    rankSep: 80  
                }).run();
                
                layoutBtn.setAttribute('data-layout', 'dagre');
                layoutBtn.innerHTML = '<span class="material-icons-round" style="font-size: 18px;">scatter_plot</span> Lực đẩy (Cose)';
                layoutBtn.style.background = 'var(--md-sys-color-tertiary-container, #fce7f3)';
                layoutBtn.style.color = 'var(--md-sys-color-on-tertiary-container, #831843)';
            } else {
                cyInstance.layout({
                    name: 'cose',
                    animate: true,
                    animationDuration: 600,
                    nodeRepulsion: function(node){ return 2048; },
                    idealEdgeLength: function(edge){ return 64; },
                    edgeElasticity: function(edge){ return 32; }
                }).run();
                
                layoutBtn.setAttribute('data-layout', 'cose');
                layoutBtn.innerHTML = '<span class="material-icons-round" style="font-size: 18px;">account_tree</span> Phân cấp (Dagre)';
                layoutBtn.style.background = 'var(--md-sys-color-primary-container, #e0e7ff)';
                layoutBtn.style.color = 'var(--md-sys-color-on-primary-container, #3730a3)';
            }
        });
    } 
});

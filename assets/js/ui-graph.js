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
                        // Tính toán cỡ chữ dựa trên số lần được nhắc đến (mention_count)
                        const mentions = ele.data('mention_count') || 1;
                        const size = 11 + Math.min(8, mentions * 1.5); 
                        return `${size}px`;
                    },
                    'text-valign': 'center',
                    'text-halign': 'center',
                    // Tự động phình to Node dựa trên thuộc tính mention_count hoặc số lượng kết nối (degree)
                    'width': function(ele) {
                        const mentions = ele.data('mention_count') || 1;
                        const degree = ele.degree(); // Số lượng cạnh nối vào Node
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
                    'shape': 'round-rectangle', // Bạn có thể đổi thành 'ellipse' (hình tròn) để trông giống Heat Map hơn
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
            // [TÍNH NĂNG MỚI] Hiệu ứng làm mờ
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
    });

    // Bắt sự kiện Click ra nền trống để bỏ focus
    cyInstance.on('tap', function(evt){
        if (evt.target === cyInstance) {
            cyInstance.elements().removeClass('faded');
        }
    });

    // Xử lý sự kiện Click vào Node
    cyInstance.on('tap', 'node', function(evt){
        const node = evt.target;
        const nodeLabel = node.data('label');
        const nodeType = node.data('type');
        const nodeColor = typeColors[nodeType] || typeColors['Unknown'];

        // --- 1. HIỆU ỨNG FOCUS TRÊN ĐỒ THỊ ---
        cyInstance.elements().addClass('faded');
        node.neighborhood().add(node).removeClass('faded');

        // --- 2. XỬ LÝ DỮ LIỆU TÌNH BÁO ---
        const trendScore = Math.round(node.data('trend_score') || 0);
        const riskProfile = node.data('risk_profile') || {};

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

        // --- 3. TRÍCH XUẤT THỰC THỂ LIÊN QUAN (BẠN NÊN ĐỌC TIẾP) ---
        const connectedNodes = node.neighborhood('node');
        let relatedEntitiesHtml = '';
        if (connectedNodes.length > 0) {
            connectedNodes.forEach(n => {
                const nColor = typeColors[n.data('type')] || typeColors['Unknown'];
                relatedEntitiesHtml += `<span style="display:inline-flex; align-items:center; padding: 4px 12px; margin: 0 8px 8px 0; background: ${nColor}15; color: ${nColor}; border: 1px solid ${nColor}40; border-radius: 16px; font-size: 13px; font-weight: 500;">${escapeHtml(n.data('label'))}</span>`;
            });
        }

        // --- 4. RENDER MODAL UI ---
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        document.getElementById('modal-reliability').innerHTML = '';
        document.getElementById('modal-mini-timeline').style.display = 'none';
        document.getElementById('toggle-sources-btn').style.display = 'none';
        document.getElementById('modal-sources').style.display = 'none';

        modalTitle.innerHTML = `<span style="color:${nodeColor}">Thực thể: ${escapeHtml(nodeLabel)}</span>`;

        let trendHtml = '';
        if (trendScore > 75) trendHtml = `<span style="color: #ef4444; font-weight:bold;">↑ ${trendScore}% (Khả năng tiếp tục nóng)</span>`;
        else if (trendScore > 40) trendHtml = `<span style="color: #f59e0b; font-weight:bold;">→ ${trendScore}% (Ổn định)</span>`;
        else trendHtml = `<span style="color: #10b981; font-weight:bold;">↓ ${trendScore}% (Tin đã hạ nhiệt)</span>`;

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
                <div style="margin-bottom: 16px; font-size: 14px;">
                    <span style="opacity: 0.7; margin-right: 8px;">Dự báo xu hướng:</span> ${trendHtml}
                </div>
                <div style="font-size: 12px; text-transform: uppercase; color: var(--md-sys-color-on-surface); font-weight: bold; margin-bottom: 12px; opacity: 0.6;">
                    Chỉ số rủi ro (Risk Graph)
                </div>
                ${riskHtml}
            </div>

            <!-- Khối Gợi ý thực thể liên quan -->
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
}

// ====================================================================
// KHỞI TẠO THANH CÔNG CỤ ĐIỀU KHIỂN ĐỒ THỊ
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('cy-search-input');
    const filterSelect = document.getElementById('cy-filter-edge');
    const resetBtn = document.getElementById('cy-reset-btn');

    // 1. TÌM KIẾM THỰC THỂ THỜI GIAN THỰC
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (!cyInstance) return;
            const term = e.target.value.toLowerCase().trim();
            
            if (!term) {
                cyInstance.elements().removeClass('faded');
                return;
            }

            cyInstance.batch(() => {
                // Làm mờ tất cả
                cyInstance.elements().addClass('faded');
                
                // Tìm các node có tên chứa từ khóa
                const matchedNodes = cyInstance.nodes().filter(node => {
                    const label = node.data('label') || '';
                    return label.toLowerCase().includes(term);
                });

                // Làm sáng các node tìm thấy và các cạnh/node lân cận của chúng
                matchedNodes.removeClass('faded');
                matchedNodes.neighborhood().removeClass('faded');
            });
        });
    }

    // 2. LỌC MỐI QUAN HỆ (EDGE FILTER)
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            if (!cyInstance) return;
            const type = e.target.value;

            cyInstance.batch(() => {
                if (type === 'all') {
                    cyInstance.edges().style('display', 'element'); // Hiện tất cả
                } else {
                    // Ẩn tất cả các cạnh trước
                    cyInstance.edges().style('display', 'none');
                    // Chỉ hiện các cạnh khớp với loại quan hệ đã chọn
                    cyInstance.edges(`[relation_type = "${type}"]`).style('display', 'element');
                }
            });
        });
    }

    // 3. NÚT KHÔI PHỤC (RESET)
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (!cyInstance) return;
            if (searchInput) searchInput.value = '';
            if (filterSelect) filterSelect.value = 'all';
            
            cyInstance.batch(() => {
                cyInstance.elements().removeClass('faded');
                cyInstance.edges().style('display', 'element');
                // Chạy lại hiệu ứng vật lý để đồ thị bung đều ra
                cyInstance.layout(cyInstance.options().layout).run();
            });
        });
    }
   // 4. CHUYỂN ĐỔI THUẬT TOÁN LAYOUT (COSE <-> DAGRE)
    const layoutBtn = document.getElementById('cy-layout-btn');
    if (layoutBtn) {
        layoutBtn.addEventListener('click', () => {
            if (!cyInstance) return;
            const currentLayout = layoutBtn.getAttribute('data-layout');
            
            if (currentLayout === 'cose') {
                // Chuyển sang dạng Cây phả hệ (Dagre)
                cyInstance.layout({
                    name: 'dagre',
                    rankDir: 'TB', // Từ trên xuống dưới (Top-to-Bottom)
                    animate: true,
                    animationDuration: 600,
                    nodeSep: 60, // Khoảng cách giữa các node cùng cấp
                    rankSep: 80  // Khoảng cách giữa các tầng
                }).run();
                
                // Đổi giao diện nút bấm
                layoutBtn.setAttribute('data-layout', 'dagre');
                layoutBtn.innerHTML = '<span class="material-icons-round" style="font-size: 18px;">scatter_plot</span> Lực đẩy (Cose)';
                layoutBtn.style.background = 'var(--md-sys-color-tertiary-container, #fce7f3)';
                layoutBtn.style.color = 'var(--md-sys-color-on-tertiary-container, #831843)';
            } else {
                // Chuyển về dạng Lực hút vật lý (Cose)
                cyInstance.layout({
                    name: 'cose',
                    animate: true,
                    animationDuration: 600,
                    nodeRepulsion: function(node){ return 2048; },
                    idealEdgeLength: function(edge){ return 64; },
                    edgeElasticity: function(edge){ return 32; }
                }).run();
                
                // Đổi giao diện nút bấm
                layoutBtn.setAttribute('data-layout', 'cose');
                layoutBtn.innerHTML = '<span class="material-icons-round" style="font-size: 18px;">account_tree</span> Phân cấp (Dagre)';
                layoutBtn.style.background = 'var(--md-sys-color-primary-container, #e0e7ff)';
                layoutBtn.style.color = 'var(--md-sys-color-on-primary-container, #3730a3)';
            }
        });
    } 
});

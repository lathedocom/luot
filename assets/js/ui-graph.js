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

    
    // =================================================================
    // Xử lý sự kiện Click vào Cạnh (Edge) -> Hiển thị Mạng lưới bằng chứng
    // =================================================================
    cyInstance.on('tap', 'edge', function(evt){
        const edge = evt.target;
        const edgeLabel = edge.data('label') || '';
        const relationType = edge.data('relation_type');
        const sourceName = edge.source().data('label');
        const targetName = edge.target().data('label');
        
        // Lấy mảng ID sự kiện làm bằng chứng đã được Backend gắn vào
        const supportingEvents = edge.data('supporting_events') || [];

        // --- 1. HIỆU ỨNG FOCUS TRÊN ĐỒ THỊ ---
        cyInstance.elements().addClass('faded');
        edge.removeClass('faded');
        edge.source().removeClass('faded');
        edge.target().removeClass('faded');

        // --- 2. TRA CỨU DỮ LIỆU TỪ RAM TRÌNH DUYỆT ---
        const allNews = getGlobalNewsData();
        const relatedEvents = allNews.filter(topic => supportingEvents.includes(topic.event_key));

        // Gom nhóm và đếm số lượng các đầu báo (Tờ báo) đã đưa tin về mối quan hệ này
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

        // --- 3. RENDER GIAO DIỆN MODAL BẰNG CHỨNG ---
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        document.getElementById('modal-reliability').innerHTML = '';
        document.getElementById('modal-mini-timeline').style.display = 'none';
        document.getElementById('toggle-sources-btn').style.display = 'none';
        document.getElementById('modal-sources').style.display = 'none';

        // Phân loại màu sắc theo loại quan hệ
        let typeText = 'Liên quan';
        let typeColor = '#64748b'; // Xám
        if (relationType === 'cause_effect') { typeText = 'Nguyên nhân ➔ Kết quả'; typeColor = '#f59e0b'; } // Cam
        else if (relationType === 'cooperation') { typeText = 'Hợp tác'; typeColor = '#10b981'; } // Xanh lá
        else if (relationType === 'conflict') { typeText = 'Xung đột'; typeColor = '#ef4444'; } // Đỏ

        modalTitle.innerHTML = `<span style="color:${typeColor}; font-size: 16px;">Phân tích: ${escapeHtml(typeText)}</span>`;

        // Tạo thẻ (Chips) cho các tờ báo
        let sourcesHtml = '';
        uniqueSources.forEach(src => {
            sourcesHtml += `<span style="display:inline-flex; align-items:center; gap: 6px; padding: 4px 12px; background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline); border-radius: 16px; font-size: 13px; font-weight: 500; margin: 0 8px 8px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);"><img src="${escapeHtml(src.source_logo || 'https://via.placeholder.com/16')}" width="16" height="16" style="border-radius:50%; background:#fff;"> ${escapeHtml(src.source_name)}</span>`;
        });

        // Tạo danh sách các bài báo chi tiết
        let listHtml = '';
        relatedEvents.forEach(item => {
            listHtml += `
                <div style="border-bottom: 1px dashed var(--md-sys-color-outline); margin-bottom: 12px; padding-bottom: 12px;">
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: var(--md-sys-color-on-surface); line-height: 1.4;">${escapeHtml(item.title || item.cluster_title)}</div>
                    <div style="font-size: 13px; opacity: 0.8; line-height: 1.5;">${escapeHtml(item.short_summary)}</div>
                </div>
            `;
        });

        // Ghép toàn bộ vào Modal
        modalBody.innerHTML = `
            <!-- Khối mô tả cốt lõi của mối quan hệ -->
            <div style="background: rgba(0,0,0,0.05); border: 1px solid var(--md-sys-color-outline); padding: 20px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: var(--md-sys-color-on-surface); display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap;">
                    <span>${escapeHtml(sourceName)}</span>
                    <span class="material-icons-round" style="color: ${typeColor}; font-size: 24px;">${relationType === 'cause_effect' ? 'east' : 'sync_alt'}</span>
                    <span>${escapeHtml(targetName)}</span>
                </div>
                ${edgeLabel ? `<div style="font-size: 15px; color: ${typeColor}; margin-top: 12px; font-style: italic;">"${escapeHtml(edgeLabel)}"</div>` : ''}
            </div>

            <!-- Khối Bằng chứng (Evidence) -->
            <div style="margin-bottom: 24px;">
                <div style="font-size: 12px; text-transform: uppercase; font-weight: bold; margin-bottom: 12px; opacity: 0.6; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 16px;">verified_user</span> 
                    Bằng chứng xác nhận (${uniqueSources.length} nguồn báo chí)
                </div>
                <div style="display: flex; flex-wrap: wrap;">
                    ${sourcesHtml || '<span style="font-size:13px; opacity:0.6; font-style: italic;">(Quan hệ do AI tổng hợp suy luận)</span>'}
                </div>
            </div>

            <!-- Khối chi tiết các sự kiện -->
            <div style="background: rgba(0,0,0,0.05); border-left: 4px solid ${typeColor}; padding: 16px; border-radius: 8px;">
                <div style="font-size: 12px; text-transform: uppercase; color: ${typeColor}; font-weight: bold; margin-bottom: 16px; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 16px;">format_list_bulleted</span> 
                    Sự kiện hình thành nên kết nối này (${relatedEvents.length})
                </div>
                ${listHtml || '<div style="font-size:13px; opacity:0.6;">Không có dữ liệu bài viết chi tiết.</div>'}
            </div>
        `;

        // Bật Modal lên
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

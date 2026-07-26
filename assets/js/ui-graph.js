// FILE: assets/js/ui-graph.js

// Bổ sung import để lấy dữ liệu tin tức và hàm xử lý text
import { getGlobalNewsData } from './api.js';
import { escapeHtml } from './utils.js';

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

    // Bảng màu chuẩn theo Type
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
                    'font-size': '12px',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'width': 'label',
                    'height': 'label',
                    'padding': '10px',
                    'shape': 'round-rectangle'
                }
            },
            // [CẬP NHẬT] Style chung cho Cạnh (Edge)
            {
                selector: 'edge',
                style: {
                    // Thuật toán tính độ dày: Lấy weight nhân 1.5, tối thiểu 2px và tối đa 8px để không bị thô
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
                    'text-background-padding': '3px'
                }
            },
            // Hợp tác: Xanh lá, đứt nét
            {
                selector: 'edge[relation_type = "cooperation"]',
                style: {
                    'line-color': '#10b981',
                    'line-style': 'dashed'
                }
            },
            // Xung đột: Đỏ
            {
                selector: 'edge[relation_type = "conflict"]',
                style: {
                    'line-color': '#ef4444'
                }
            },
            // Nguyên nhân - Kết quả: Cam, có mũi tên
            {
                selector: 'edge[relation_type = "cause_effect"]',
                style: {
                    'line-color': '#f59e0b',
                    'target-arrow-shape': 'triangle',
                    'target-arrow-color': '#f59e0b'
                }
            },
            // Liên quan thông thường: Xám
            {
                selector: 'edge[relation_type = "neutral"]',
                style: {
                    'line-color': '#475569'
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

    // ====================================================================
    // [GIAI ĐOẠN 2] XỬ LÝ SỰ KIỆN CLICK VÀO NODE HIỂN THỊ MODAL BÀI BÁO
    // ====================================================================
    cyInstance.on('tap', 'node', function(evt){
        const node = evt.target;
        const nodeLabel = node.data('label');
        const nodeType = node.data('type');
        const nodeColor = typeColors[nodeType] || typeColors['Unknown'];

        // 1. Lấy toàn bộ tin tức và Lọc ra các bài chứa thực thể này
        const allNews = getGlobalNewsData();
        const relatedEvents = allNews.filter(topic => {
            if (!topic.entities) return false;
            return topic.entities.some(e => {
                // Nhận diện cả dạng object {name, type} và dạng chuỗi thuần
                const entityName = typeof e === 'object' ? (e.name || '') : String(e);
                return entityName.toLowerCase() === nodeLabel.toLowerCase();
            });
        });

        // Nếu không có tin liên quan, thoát
        if (relatedEvents.length === 0) return;

        // 2. Sắp xếp tin mới nhất lên đầu
        relatedEvents.sort((a, b) => b.timestamp - a.timestamp);

        // 3. Chuẩn bị UI cho Modal
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        // Ẩn các thành phần thừa của modal tin tức thông thường
        const reliabilityContainer = document.getElementById('modal-reliability');
        const miniTimelineContainer = document.getElementById('modal-mini-timeline');
        const toggleBtn = document.getElementById('toggle-sources-btn');
        const sourcesContainer = document.getElementById('modal-sources');
        
        if (reliabilityContainer) reliabilityContainer.innerHTML = '';
        if (miniTimelineContainer) miniTimelineContainer.style.display = 'none';
        if (toggleBtn) toggleBtn.style.display = 'none';
        if (sourcesContainer) sourcesContainer.style.display = 'none';

        // 4. Render danh sách bài viết
        modalTitle.innerHTML = `<span style="color:${nodeColor}">Thực thể: ${escapeHtml(nodeLabel)}</span>`;
        
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

        // 5. Đổ vào Modal và hiển thị
        modalBody.innerHTML = `
            <div style="background: rgba(0,0,0,0.05); border-left: 4px solid ${nodeColor}; padding: 16px; border-radius: 8px;">
                <div style="font-size: 12px; text-transform: uppercase; color: ${nodeColor}; font-weight: bold; margin-bottom: 16px; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 16px;">library_books</span> 
                    Các sự kiện liên quan (${relatedEvents.length})
                </div>
                ${listHtml}
            </div>
        `;

        document.getElementById('intelligence-modal').classList.add('active');
    });
}

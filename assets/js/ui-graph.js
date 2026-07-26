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
    // [GIAI ĐOẠN 4] XỬ LÝ SỰ KIỆN CLICK: HIỂN THỊ HỒ SƠ RỦI RO & BÀI BÁO
    // ====================================================================
    cyInstance.on('tap', 'node', function(evt){
        const node = evt.target;
        const nodeLabel = node.data('label');
        const nodeType = node.data('type');
        const nodeColor = typeColors[nodeType] || typeColors['Unknown'];
        
        // Lấy dữ liệu tình báo từ Node
        const trendScore = Math.round(node.data('trend_score') || 0);
        const riskProfile = node.data('risk_profile') || {};

        // Lọc bài báo liên quan
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

        // Chuẩn bị UI Modal
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        document.getElementById('modal-reliability').innerHTML = '';
        document.getElementById('modal-mini-timeline').style.display = 'none';
        document.getElementById('toggle-sources-btn').style.display = 'none';
        document.getElementById('modal-sources').style.display = 'none';

        modalTitle.innerHTML = `<span style="color:${nodeColor}">Thực thể: ${escapeHtml(nodeLabel)}</span>`;

        // 1. Dựng khối Dự báo Xu hướng (Trend)
        let trendHtml = '';
        if (trendScore > 75) trendHtml = `<span style="color: #ef4444; font-weight:bold;">↑ ${trendScore}% (Khả năng tiếp tục nóng)</span>`;
        else if (trendScore > 40) trendHtml = `<span style="color: #f59e0b; font-weight:bold;">→ ${trendScore}% (Ổn định)</span>`;
        else trendHtml = `<span style="color: #10b981; font-weight:bold;">↓ ${trendScore}% (Tin đã hạ nhiệt)</span>`;

        // 2. Dựng khối Chỉ số Rủi ro (Risk Graph)
        let riskHtml = '';
        const categoryLabels = { military: 'Quân sự / Xung đột', economy: 'Kinh tế', politics: 'Chính trị', finance: 'Tài chính', tech: 'Công nghệ', law: 'Pháp luật' };
        
        if (Object.keys(riskProfile).length > 0) {
            for (let cat in riskProfile) {
                if (categoryLabels[cat]) {
                    // Mỗi lần xuất hiện cộng 25% độ dài thanh bar (tối đa 100%)
                    const barWidth = Math.min(100, riskProfile[cat] * 25); 
                    riskHtml += `
                    <div style="margin-bottom: 8px; display: flex; align-items: center; font-size: 13px;">
                        <span style="width: 120px; display: inline-block; opacity: 0.8;">${categoryLabels[cat]}</span>
                        <div style="flex-grow: 1; background: var(--md-sys-color-background); height: 10px; border-radius: 4px; overflow: hidden; border: 1px solid var(--md-sys-color-outline);">
                            <div style="width: ${barWidth}%; background: ${nodeColor}; height: 100%; transition: width 0.5s ease;"></div>
                        </div>
                    </div>`;
                }
            }
        } else {
            riskHtml = '<p style="font-size: 13px; opacity: 0.6; margin: 0;">Chưa ghi nhận rủi ro cụ thể.</p>';
        }

        // 3. Dựng khối Danh sách bài báo
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

        // 4. Lắp ráp toàn bộ vào Modal Body
        modalBody.innerHTML = `
            <!-- Khối Bảng điều khiển Tình báo -->
            <div style="background: rgba(0,0,0,0.05); border: 1px solid var(--md-sys-color-outline); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <div style="margin-bottom: 16px; font-size: 14px;">
                    <span style="opacity: 0.7; margin-right: 8px;">Dự báo xu hướng:</span> ${trendHtml}
                </div>
                <div style="font-size: 12px; text-transform: uppercase; color: var(--md-sys-color-on-surface); font-weight: bold; margin-bottom: 12px; opacity: 0.6;">
                    Chỉ số rủi ro (Risk Graph)
                </div>
                ${riskHtml}
            </div>

            <!-- Khối Danh sách sự kiện -->
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

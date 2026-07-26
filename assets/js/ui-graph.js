// FILE: assets/js/ui-graph.js

let cyInstance = null;
let savedGraphData = null;

export function renderKnowledgeGraph(graphData) {
    savedGraphData = graphData;
    const cyContainer = document.getElementById('cy-container');
    if (!cyContainer || !savedGraphData || !savedGraphData.nodes) return;

    // Canh lúc tab hiện lên mới vẽ đồ thị
    const resizeObserver = new ResizeObserver(() => {
        if (cyContainer.offsetWidth > 0) {
            if (!cyInstance) {
                initCy(cyContainer);
            } else {
                cyInstance.resize();
            }
        }
    });
    resizeObserver.observe(cyContainer);
}

function initCy(container) {
    // Định nghĩa bảng màu cho từng loại thực thể
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
                    'padding': '8px',
                    'shape': 'round-rectangle'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#334155',
                    'curve-style': 'bezier',
                    'opacity': 0.6
                }
            }
        ],
        layout: {
            name: 'cose', // Thuật toán giả lập lực hút-đẩy vật lý giúp các Node tự giãn cách đẹp mắt
            animate: true,
            nodeRepulsion: 400000,
            idealEdgeLength: 100
        }
    });

    // Bắt sự kiện Click vào Node
    cyInstance.on('tap', 'node', function(evt){
        const node = evt.target;
        const nodeLabel = node.data('label');
        const nodeType = node.data('type');
        
        // [TODO] Chờ làm tiếp ở Giai đoạn 2: Bấm vào Node hiện danh sách bài viết
        console.log(`Đã bấm vào ${nodeType}: ${nodeLabel}`);
    });
}

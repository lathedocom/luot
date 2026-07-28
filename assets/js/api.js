// ==========================================================================
// FILE: assets/js/api.js
// ==========================================================================
import { renderDigestFeed, renderBriefing, renderMarket, renderSocial, renderTimelinePage, renderKnowledgeGraph } from './ui.js';

let globalNewsData = [];
let globalDigestData = { vietnam: [], asia: [], global: [] };
let totalCrawledArticles = 0;

export let globalMapData = null;

// Các hàm Getter để cung cấp dữ liệu an toàn cho các module khác
export const getGlobalNewsData = () => globalNewsData;
export const getGlobalDigestData = () => globalDigestData;
export const getTotalCrawledArticles = () => totalCrawledArticles;

export async function fetchMapData() {
    try {
        // Đọc thẳng file tĩnh vừa được generate từ backend
        const response = await fetch(`data/countries/indices_latest.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Network error');
        globalMapData = await response.json();
        
        if (globalMapData) {
            import('./ui-map.js').then(module => {
                module.renderRiskMap(globalMapData);
            });
        }
    } catch (error) {
        console.error("Lỗi fetchMapData:", error);
    }
}

export async function fetchNewsData() {
    try {
        const response = await fetch(`news_data.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        
        globalNewsData = data.news || [];
        globalDigestData = data.digest || { vietnam: [], asia: [], global: [] };
        totalCrawledArticles = data.statistics ? data.statistics.total_articles : 0;
        
        try {
            renderDigestFeed(globalDigestData); 
        } catch (e) {
            console.error("Lỗi nội bộ khi render Digest:", e);
            throw e;
        }

        renderBriefing(data.daily_briefing);
        renderMarket(data.market_data || []);
        renderSocial(data.social_trends || data.social || []);
        
        // (Phần renderRiskMap cũ ở đây đã được gỡ bỏ để chuyển sang dùng fetchMapData riêng)
        
        // [ĐÃ SỬA] Đưa vào bên trong khối try để nhận diện được biến data
        if (data.knowledge_graph) {
            renderKnowledgeGraph(data.knowledge_graph);
        }
        
    } catch (error) {
        console.error("Lỗi fetchNewsData:", error);
        document.getElementById('news-container').innerHTML = `<div class="news-card"><p>Lỗi kết nối. Không thể tải dữ liệu Intelligence. Chi tiết: ${error.message}</p></div>`;
    }
}

export async function fetchTimelineData() {
    try {
        const response = await fetch(`timeline_data.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        renderTimelinePage(data.stories || []);
    } catch (error) {
        document.getElementById('timeline-page-container').innerHTML = `<p>Lỗi tải Timeline.</p>`;
    }
}

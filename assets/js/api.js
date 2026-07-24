// ==========================================================================
// FILE: assets/js/api.js
// ==========================================================================
import { 
    renderDigestFeed, 
    renderBriefing, 
    renderMarket, 
    renderSocial, 
    renderTimelinePage 
} from './ui.js';

let globalNewsData = [];
let globalDigestData = { vietnam: [], asia: [], global: [] };
let totalCrawledArticles = 0;

// Các hàm Getter để cung cấp dữ liệu an toàn cho các module khác
export const getGlobalNewsData = () => globalNewsData;
export const getGlobalDigestData = () => globalDigestData;
export const getTotalCrawledArticles = () => totalCrawledArticles;

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
        renderSocial(data.social || []); 
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

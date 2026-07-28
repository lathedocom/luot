const gateway = require('../ai/gateway');
const { computeSeverity } = require('../index/compute_indices');
const logger = require('../utils/logger');

async function batchEnrichEvents(newEvents) {
    if (!newEvents || newEvents.length === 0) return [];
    
    // Gom tối đa 15 events / 1 prompt để đảm bảo JSON trả về không bị cắt ngắn
    const BATCH_SIZE = 15;
    const enrichedEvents = [];

    for (let i = 0; i < newEvents.length; i += BATCH_SIZE) {
        const batch = newEvents.slice(i, i + BATCH_SIZE);
        
        let eventsListText = '';
        batch.forEach((ev, index) => {
            const combinedSummaries = ev.articles.slice(0, 3).map(a => a.summary).join(' | ');
            eventsListText += `[ID: ${ev.id}]\nTiêu đề: ${ev.articles[0].title}\nNội dung: ${combinedSummaries}\n\n`;
        });

        logger.info(`Đang gọi AI Enrichment cho batch ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} sự kiện)...`);
        
        try {
            // Task EVENT_ENRICHMENT đã được cấu hình trong tasks.js
            const aiResults = await gateway.executeTask('EVENT_ENRICHMENT', { eventsListText });
            
            // Map kết quả AI trả về vào các Event tương ứng
            batch.forEach((ev, index) => {
                const aiData = aiResults[index] || {};
                
                // Gắn dữ liệu AI
                ev.category = aiData.category || 'Tin tức chung';
                ev.casualties_scale = aiData.casualties_scale || 'none';
                ev.geo_scope = aiData.geo_scope || 'local';
                ev.is_escalating_language = aiData.is_escalating_language || false;
                ev.impact_vn = aiData.impact_vn || 'low';
                ev.impact_global = aiData.impact_global || 'low';
                ev.summary_ai = aiData.summary_2_sentences || ev.articles[0].summary;
                
                // Dùng hàm Thuần Toán (không AI) để tính điểm dựa trên thuộc tính AI phân loại
                ev.severity = computeSeverity(ev, ev.source_count);
                ev.confidence = Math.round((Math.min(ev.source_count / 5, 1) * 0.6 + 0.4) * 100) / 100; // Công thức đơn giản
                ev.status = 'active';
                ev.occurred_at = ev.created_at;
                
                enrichedEvents.push(ev);
            });
        } catch (error) {
            logger.error(`Lỗi Batch Enrichment: ${error.message}`);
            // Fallback an toàn nếu AI sập
            batch.forEach(ev => {
                ev.severity = 3.0;
                ev.summary_ai = ev.articles[0].summary;
                ev.status = 'active';
                enrichedEvents.push(ev);
            });
        }
    }

    return enrichedEvents;
}

module.exports = { batchEnrichEvents };

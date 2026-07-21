const eventBus = require('./core/event_bus');
const logger = require('./modules/utils/logger');
const fs = require('fs');
const path = require('path');
const PIPELINE_STATUS_FILE = path.join(__dirname, '../pipeline_status.json');

// IMPORT CÁC MODULE XỬ LÝ LÕI
const { processEventIntoTimeline } = require('./modules/6_timeline_manager');
const { processTopicIntoStory } = require('./modules/story/story_engine');
const { fetchAndNormalizeNews } = require('./modules/1_crawler');
const { extractCategories } = require('./modules/rule_engine/category');
const { extractRegions } = require('./modules/rule_engine/region');
const { calculateImportance } = require('./modules/scoring/importance');
const { generateEmbeddings } = require('./modules/2_embedding');
const { clusterArticles } = require('./modules/3_clustering');
const { extractEntities } = require('./modules/4_nlp_entity');
const { buildRuleBasedGraph } = require('./modules/5_knowledge_graph');
const { analyzeClusterMultiDimensional } = require('./modules/5_ai_analysis');
const { generateEventKey, generateTopicKey } = require('./modules/topic/topic_key');
const topicStore = require('./modules/topic/topic_store');
const { mergeIntoExistingTopic } = require('./modules/topic/topic_merger');
const { evaluateClusterAction } = require('./modules/topic/similarity_engine');
const { fetchAllMarketData } = require('./modules/market/index');
const { fetchAllSocialTrends } = require('./modules/social/index');
const { generateAllReports } = require('./modules/reports/index');
// BỔ SUNG IMPORT GATEWAY
const gateway = require('./modules/ai/gateway'); 
// BỔ SUNG IMPORT JACCARD (LỚP PHÒNG THỦ MỚI)
const { jaccardSimilarity } = require('./modules/utils/text_similarity');

// BIẾN TRẠNG THÁI TOÀN CỤC CHO PIPELINE
const state = {
    startTime: Date.now(),
    articles: [],
    clusters: [],
    currentTopics: [],
    newTopicsCount: 0,
    marketData: [],
    socialTrends: [],
    reports: {},
    pendingParallelTasks: 3 
};

// ============================================================================
// HỆ THỐNG ĐỊNH TUYẾN SỰ KIỆN (EVENT ROUTING)
// ============================================================================

eventBus.on('START_PIPELINE', async () => {
    logger.clearErrorLogs();
    logger.info("=== KHỞI ĐỘNG HỆ THỐNG TIN TỨC V4.5 (EVENT-DRIVEN ARCHITECTURE) ===");
    try {
        const articles = await fetchAndNormalizeNews();
        eventBus.emit('RSS_FETCHED', articles);
    } catch (e) {
        eventBus.emit('PIPELINE_ERROR', e);
    }
});

eventBus.on('RSS_FETCHED', async (articles) => {
    try {
        const enriched = articles.map(article => ({
            ...article,
            categories: extractCategories(article.title + " " + article.summary),
            regions: extractRegions(article.title + " " + article.summary, article.source_name),
            importance: calculateImportance(
                extractCategories(article.title + " " + article.summary), 
                extractRegions(article.title + " " + article.summary, article.source_name), 
                1
            )
        }));
        state.articles = enriched;
        
        const embedded = await generateEmbeddings(enriched);
        eventBus.emit('EMBEDDING_DONE', embedded);
    } catch (e) {
        eventBus.emit('PIPELINE_ERROR', e);
    }
});

eventBus.on('EMBEDDING_DONE', (embeddedArticles) => {
    const clusters = clusterArticles(embeddedArticles);
    state.clusters = clusters;
    eventBus.emit('CLUSTER_CREATED', clusters);
});

eventBus.on('CLUSTER_CREATED', async (clusters) => {
    try {
        const db = topicStore.readData();
        state.currentTopics = db.news || [];
        
        for (const cluster of clusters) {
            const entities = extractEntities(cluster.combined_text);
            const eventKey = generateEventKey(entities);
            const ruleGraph = buildRuleBasedGraph(entities);
            
            const { action, bestMatch } = evaluateClusterAction(cluster.main_vector, state.currentTopics);
            
            if (action === 'SKIP') {
                logger.info(`[SKIP] Bỏ qua cụm tin trùng lặp cao: ${cluster.articles[0].title}`);
                continue;
            }
            
            if ((action === 'MERGE' || action === 'LIGHT_UPDATE') && bestMatch) {
                const updatedTopic = mergeIntoExistingTopic(bestMatch, cluster.articles, cluster.articles[0].title);
                const index = state.currentTopics.findIndex(t => t.event_key === bestMatch.event_key);
                if (index !== -1) state.currentTopics[index] = updatedTopic;
                logger.info(`[${action}] Gộp diễn biến mới thành công vào Topic cũ: ${eventKey}`);
                continue;
            }

            if (action === 'VERIFY_BY_AI' && bestMatch) {
                logger.info(`[AI Gatekeeper] Cần xác minh AI cho cụm tin mới với chủ đề: ${bestMatch.title}`);
                
                const prompt = `
Tôi có một chủ đề đang theo dõi: "${bestMatch.title}"
Và một cụm tin tức mới vừa thu thập: "${cluster.articles[0].title}"
Tóm tắt tin mới: "${cluster.articles[0].summary}"

Hai thông tin này có phải nói về cùng một sự kiện/chủ đề không, hay là hai sự kiện riêng biệt?
LỆNH TUYỆT ĐỐI: CHỈ trả về JSON duy nhất định dạng:
{
  "is_same_event": true hoặc false,
  "reason": "Giải thích ngắn gọn 1 câu"
}`;

                try {
                    const aiDecision = await gateway.executeTask('MATCH_TIMELINE', prompt); 
                    
                    if (aiDecision && aiDecision.is_same_event) {
                        logger.info(`[AI Gatekeeper] Quyết định: GỘP (Lý do: ${aiDecision.reason})`);
                        const updatedTopic = mergeIntoExistingTopic(bestMatch, cluster.articles, cluster.articles[0].title);
                        const index = state.currentTopics.findIndex(t => t.event_key === bestMatch.event_key);
                        if (index !== -1) state.currentTopics[index] = updatedTopic;
                        logger.info(`[MERGE-AI] Gộp diễn biến mới thành công vào Topic cũ: ${eventKey}`);
                        continue; 
                    } else {
                        logger.info(`[AI Gatekeeper] Quyết định: TÁCH TẠO MỚI (Lý do: ${aiDecision.reason})`);
                    }
                } catch (error) {
                    logger.warn(`[AI Gatekeeper] Lỗi xác minh: ${error.message}. Fallback: Tách tạo mới để an toàn.`);
                }
            }

            // --- 🛡️ BẢN VÁ LỚP PHÒNG THỦ 2: SO KHỚP VĂN BẢN KHẮT KHE ---
            const TWO_DAYS_MS = 48 * 60 * 60 * 1000;
            const recentTopics = state.currentTopics.filter(t => Date.now() - (t.timestamp || Date.now()) < TWO_DAYS_MS);

            const duplicateTopic = recentTopics.find(t => {
                const titleSim = jaccardSimilarity(t.title, cluster.articles[0].title);
                const fullSim = jaccardSimilarity(
                    t.title + ' ' + (t.short_summary || ''), 
                    cluster.articles[0].title + ' ' + cluster.articles[0].summary
                );
                // Tiêu chí gắt gao: Tiêu đề giống >= 55% HOẶC tổng thể giống >= 50%
                return titleSim >= 0.55 || fullSim >= 0.50;
            });

            if (duplicateTopic) {
                logger.info(`[TEXT-DEDUP] Phát hiện trùng lặp văn bản với: "${duplicateTopic.title}". Tiến hành gộp nguồn.`);
                
                // ĐÃ SỬA: Truyền cluster.articles[0].title để giữ dấu vết cập nhật (không dùng duplicateTopic.title)
                const merged = mergeIntoExistingTopic(duplicateTopic, cluster.articles, cluster.articles[0].title);
                const idx = state.currentTopics.findIndex(t => t.event_key === duplicateTopic.event_key);
                if (idx !== -1) state.currentTopics[idx] = merged;
                
                continue; // Thoát vòng lặp, bỏ qua gọi AI
            }
            // ------------------------------------------------------------
            
            logger.info(`Đang gọi AI phân tích Topic mới...`);
            const aiIntelligence = await analyzeClusterMultiDimensional(cluster, eventKey);
            
            const newTopic = {
                event_key: eventKey,
                topic_key: generateTopicKey(eventKey, 'intelligence'),
                title: aiIntelligence.cluster_title,
                timestamp: cluster.timestamp || Date.now(),
                vector: cluster.main_vector, 
                short_summary: aiIntelligence.short_summary,
                detailed_summary: aiIntelligence.detailed_summary,
                causes: aiIntelligence.causes,
                effects: aiIntelligence.effects,
                affected_groups: aiIntelligence.affected_groups,
                market_impact: aiIntelligence.market_impact,
                follow_up: aiIntelligence.follow_up,
                sources: cluster.articles.map(a => ({ url: a.url, source_name: a.source_name, source_logo: a.source_logo }))
            };
            
            state.currentTopics.push(newTopic);
            state.newTopicsCount++;
            
            const eventDate = newTopic.timestamp ? new Date(newTopic.timestamp).toISOString() : new Date().toISOString();
            const eventUrl = (newTopic.articles && newTopic.articles.length > 0) 
                ? (newTopic.articles[0].link || newTopic.articles[0].url) 
                : "#"; 
            const eventCategories = newTopic.category || ["Tin tức chung"]; 
            const eventVector = newTopic.vector;
            
            await processEventIntoTimeline(
                newTopic.id, 
                newTopic.title || newTopic.cluster_title,
                newTopic.summary || newTopic.short_summary, 
                eventDate,
                eventCategories,
                eventVector,
                eventUrl
            );
        }
        
        eventBus.emit('TOPIC_UPDATED', state.currentTopics);
        
    } catch (e) {
        eventBus.emit('PIPELINE_ERROR', e);
    }
});

eventBus.on('TOPIC_UPDATED', (currentTopics) => {
    logger.info("Khởi chạy song song (Asynchronous) các luồng dữ liệu vệ tinh...");
    
    fetchAllMarketData()
        .then(data => { state.marketData = data; eventBus.emit('MARKET_UPDATED'); })
        .catch(e => eventBus.emit('PIPELINE_ERROR', e));
        
    fetchAllSocialTrends()
        .then(data => { state.socialTrends = data; eventBus.emit('SOCIAL_UPDATED'); })
        .catch(e => eventBus.emit('PIPELINE_ERROR', e));
        
    generateAllReports(currentTopics)
        .then(data => { state.reports = data; eventBus.emit('REPORT_CREATED'); })
        .catch(e => eventBus.emit('PIPELINE_ERROR', e));
});

const synchronizeParallelTasks = () => {
    state.pendingParallelTasks--;
    if (state.pendingParallelTasks === 0) {
        eventBus.emit('SYNC_DATABASE');
    }
};
eventBus.on('MARKET_UPDATED', synchronizeParallelTasks);
eventBus.on('SOCIAL_UPDATED', synchronizeParallelTasks);
eventBus.on('REPORT_CREATED', synchronizeParallelTasks);

eventBus.on('SYNC_DATABASE', () => {
    try {
        const db = topicStore.readData();
        
        const uniqueTopics = new Map();
        if (state.currentTopics && state.currentTopics.length > 0) {
            for (const topic of state.currentTopics) {
                if (topic && topic.event_key) {
                    uniqueTopics.set(topic.event_key, topic);
                }
            }
        }
        
        const filteredTopics = [...uniqueTopics.values()];
        db.news = filteredTopics.sort((a, b) => b.timestamp - a.timestamp || (b.hot_score || 0) - (a.hot_score || 0));
        
        db.market_data = state.marketData || [];
        db.social_trends = state.socialTrends || [];
        db.daily_briefing = (state.reports && state.reports.daily) ? state.reports.daily : "";
        db.statistics = { 
            total_topics: filteredTopics.length, 
            total_articles: state.articles ? state.articles.length : 0 
        };
        
        topicStore.writeData(db);
        eventBus.emit('PIPELINE_FINISHED');
    } catch (e) {
        eventBus.emit('PIPELINE_ERROR', e);
    }
});

eventBus.on('PIPELINE_FINISHED', () => {
    const durationMs = Date.now() - state.startTime;
    const status = {
        status: { success: true, duration_ms: durationMs, last_run: new Date().toISOString() },
        metrics: { articles_processed: state.articles.length, clusters_formed: state.clusters.length, new_topics: state.newTopicsCount },
        quota: { embedding_calls: state.articles.length },
        errors: logger.getErrorLogs()
    };
    fs.writeFileSync(PIPELINE_STATUS_FILE, JSON.stringify(status, null, 2));
    logger.success(`=== PIPELINE V4.5 HOÀN TẤT TUYỆT ĐỐI SAU ${durationMs}ms ===`);
    process.exit(0);
});

eventBus.on('PIPELINE_ERROR', (error) => {
    logger.error("PIPELINE THẤT BẠI CẤP ĐỘ HỆ THỐNG!", error);
    const failStatus = { status: { success: false, last_run: new Date().toISOString() }, errors: logger.getErrorLogs() };
    fs.writeFileSync(PIPELINE_STATUS_FILE, JSON.stringify(failStatus, null, 2));
    process.exit(1); 
});

eventBus.emit('START_PIPELINE');

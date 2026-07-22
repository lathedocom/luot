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
// BỔ SUNG IMPORT CLEANUP CACHE (ĐÃ THIẾU GÂY LỖI ReferenceError)
const { cleanupCache } = require('./modules/cache/cache_manager');

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
  cleanupCache('embedding_cache');
  cleanupCache('ai_cache');
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

            // --- 🛡️ LỚP PHÒNG THỦ A: SO KHỚP EVENT_KEY CHÍNH XÁC (miễn phí, ưu tiên cao nhất) ---
            const exactMatch = state.currentTopics.find(t => t.event_key === eventKey);
            if (exactMatch) {
                const merged = mergeIntoExistingTopic(exactMatch, cluster.articles, cluster.articles[0].title);
                const idx = state.currentTopics.findIndex(t => t.event_key === eventKey);
                if (idx !== -1) state.currentTopics[idx] = merged;
                logger.info(`[EXACT-KEY] Trùng thực thể với: "${exactMatch.title}". Đã gộp, không tốn AI.`);
                continue;
            }

            // --- 🛡️ LỚP PHÒNG THỦ B: SO KHỚP VĂN BẢN JACCARD (miễn phí) ---
            const TWO_DAYS_MS = 48 * 60 * 60 * 1000;
            const recentTopics = state.currentTopics.filter(t => Date.now() - (t.timestamp || Date.now()) < TWO_DAYS_MS);
            const jaccardMatch = recentTopics.find(t => {
                const titleSim = jaccardSimilarity(t.title, cluster.articles[0].title);
                const fullSim = jaccardSimilarity(
                    t.title + ' ' + (t.short_summary || ''),
                    cluster.articles[0].title + ' ' + cluster.articles[0].summary
                );
                return titleSim >= 0.55 || fullSim >= 0.5;
            });
            if (jaccardMatch) {
                const merged = mergeIntoExistingTopic(jaccardMatch, cluster.articles, cluster.articles[0].title);
                const idx = state.currentTopics.findIndex(t => t.event_key === jaccardMatch.event_key);
                if (idx !== -1) state.currentTopics[idx] = merged;
                logger.info(`[TEXT-DEDUP] Trùng văn bản với: "${jaccardMatch.title}". Đã gộp, không tốn AI.`);
                continue;
            }

            // --- 🛡️ LỚP PHÒNG THỦ C: VERIFY_BY_AI (chỉ dùng cho vùng điểm mơ hồ 0.60-0.70) ---
            if (action === 'VERIFY_BY_AI' && bestMatch) {
                const verifyPrompt = `
[SỰ KIỆN ĐANG XÉT]: ${cluster.articles[0].title} - ${cluster.articles[0].summary}
[SỰ KIỆN ĐÃ CÓ TRONG DB]: ${bestMatch.title} - ${bestMatch.short_summary}
Hai sự kiện trên có phải cùng nói về 1 sự việc không? CHỈ TRẢ VỀ JSON:
{ "is_same_event": true/false }`;
                try {
                    const verifyResult = await gateway.executeTask('MATCH_TIMELINE', verifyPrompt);
                    if (verifyResult && verifyResult.is_same_event) {
                        const merged = mergeIntoExistingTopic(bestMatch, cluster.articles, cluster.articles[0].title);
                        const idx = state.currentTopics.findIndex(t => t.event_key === bestMatch.event_key);
                        if (idx !== -1) state.currentTopics[idx] = merged;
                        logger.info(`[VERIFY_BY_AI] Xác nhận trùng với: "${bestMatch.title}". Đã gộp.`);
                        continue;
                    }
                } catch (e) {
                    logger.warn(`[VERIFY_BY_AI] Lỗi xác minh, xử lý như tin mới: ${e.message}`);
                }
            }

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
                significance: aiIntelligence.significance,
                unknowns: aiIntelligence.unknowns,
                confidence_note: aiIntelligence.confidence_note,
                scenarios: aiIntelligence.scenarios,
                sources: cluster.articles.map(a => ({ url: a.url, source_name: a.source_name, source_logo: a.source_logo }))
            };

            state.currentTopics.push(newTopic);
            state.newTopicsCount++;

            // SỬA: lấy url & category từ "cluster" (nguồn đúng), KHÔNG lấy từ "newTopic" (không có field này)
            const eventDate = newTopic.timestamp ? new Date(newTopic.timestamp).toISOString() : new Date().toISOString();
            const eventUrl = (cluster.articles && cluster.articles.length > 0)
                ? (cluster.articles[0].link || cluster.articles[0].url)
                : "#";
            const eventCategories = (cluster.articles[0] && cluster.articles[0].categories) || ["Tin tức chung"];
            const eventVector = newTopic.vector;

            await processEventIntoTimeline(
                newTopic.event_key,
                newTopic.title,
                newTopic.short_summary,
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

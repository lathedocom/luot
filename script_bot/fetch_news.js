const eventBus = require('./core/event_bus');
const logger = require('./modules/utils/logger');
const fs = require('fs');
const path = require('path');
const PIPELINE_STATUS_FILE = path.join(__dirname, '../pipeline_status.json');

// IMPORT CÁC MODULE XỬ LÝ LÕI
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
    pendingParallelTasks: 3 // Market, Social, Reports
};

// ============================================================================
// HỆ THỐNG ĐỊNH TUYẾN SỰ KIỆN (EVENT ROUTING)
// ============================================================================

// 1. BẮT ĐẦU PIPELINE
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

// 2. CHUẨN HÓA VÀ EMBEDDING
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

// 3. GOM CỤM
eventBus.on('EMBEDDING_DONE', (embeddedArticles) => {
    const clusters = clusterArticles(embeddedArticles);
    state.clusters = clusters;
    eventBus.emit('CLUSTER_CREATED', clusters);
});

// 4. KIỂM ĐỊNH SIMILARITY & PHÂN TÍCH AI
eventBus.on('CLUSTER_CREATED', async (clusters) => {
    try {
        const db = topicStore.readData();
        state.currentTopics = db.news || [];
        
        for (const cluster of clusters) {
            const entities = extractEntities(cluster.combined_text);
            const eventKey = generateEventKey(entities);
            const ruleGraph = buildRuleBasedGraph(entities);
            
            // Động cơ Similarity đưa ra phán quyết tiết kiệm Quota
            const { action, bestMatch } = evaluateClusterAction(cluster.main_vector, state.currentTopics);
            
            if (action === 'SKIP') {
                logger.info(`[SKIP] Bỏ qua cụm tin trùng lặp cao: ${cluster.articles[0].title}`);
                continue;
            }
            
           // SỬA: Cho phép cả MERGE và LIGHT_UPDATE được gộp chung vào 1 Timeline
            if ((action === 'MERGE' || action === 'LIGHT_UPDATE') && bestMatch) {
                const updatedTopic = mergeIntoExistingTopic(bestMatch, cluster.articles, cluster.articles[0].title);
                const index = state.currentTopics.findIndex(t => t.event_key === bestMatch.event_key);
                if (index !== -1) state.currentTopics[index] = updatedTopic;
                logger.info(`[${action}] Gộp diễn biến mới thành công vào Topic cũ: ${eventKey}`);
                continue;
            }
            
            // Động cơ Similarity (Chỉ dùng để loại bỏ rác trùng lặp chính xác 100%)
            const { action, bestMatch } = evaluateClusterAction(cluster.main_vector, state.currentTopics);
            
            if (action === 'SKIP') {
                logger.info(`[SKIP] Bỏ qua cụm tin trùng lặp cao: ${cluster.articles[0].title}`);
                continue;
            }
            
            logger.info(`Đang gọi AI phân tích Topic mới...`);
            const aiIntelligence = await analyzeClusterMultiDimensional(cluster, eventKey);
            
            // Tạo đối tượng Topic (Chỉ chứa dữ liệu tĩnh của thời điểm này, KHÔNG có mảng timeline)
            const newTopic = {
                event_key: eventKey,
                topic_key: generateTopicKey(eventKey, 'intelligence'),
                title: aiIntelligence.cluster_title,
                timestamp: cluster.timestamp || Date.now(),
                vector: cluster.main_vector, // Quan trọng: Phải truyền vector đi để Story Engine tính toán
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

            // [MỚI] Chuyển Topic mới sinh sang Story Engine để xếp vào dòng chảy
            await processTopicIntoStory(newTopic);
        }
        
        eventBus.emit('TOPIC_UPDATED', state.currentTopics);
    } catch (e) {
        eventBus.emit('PIPELINE_ERROR', e);
    }
});

// 5. CHẠY SONG SONG CÁC TIẾN TRÌNH RÂU RIA (Thị trường, MXH, Report)
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

// LẮNG NGHE VÀ ĐỒNG BỘ TIẾN TRÌNH SONG SONG
const synchronizeParallelTasks = () => {
    state.pendingParallelTasks--;
    if (state.pendingParallelTasks === 0) {
        eventBus.emit('SYNC_DATABASE');
    }
};
eventBus.on('MARKET_UPDATED', synchronizeParallelTasks);
eventBus.on('SOCIAL_UPDATED', synchronizeParallelTasks);
eventBus.on('REPORT_CREATED', synchronizeParallelTasks);

// 6. ĐỒNG BỘ HÓA DỮ LIỆU CUỐI CÙNG VÀO FILE TĨNH
eventBus.on('SYNC_DATABASE', () => {
    try {
        const db = topicStore.readData();
        db.news = state.currentTopics.sort((a, b) => b.timestamp - a.timestamp || b.hot_score - a.hot_score);
        db.market_data = state.marketData;
        db.social_trends = state.socialTrends;
        db.daily_briefing = state.reports.daily || "";
        db.statistics = { total_topics: state.currentTopics.length, total_articles: state.articles.length };
        
        topicStore.writeData(db);
        eventBus.emit('PIPELINE_FINISHED');
    } catch (e) {
        eventBus.emit('PIPELINE_ERROR', e);
    }
});

// 7. KẾT THÚC THÀNH CÔNG VÀ LƯU LOG
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

// 8. XỬ LÝ SỰ CỐ NGẮT MẠCH (CIRCUIT BREAKER)
eventBus.on('PIPELINE_ERROR', (error) => {
    logger.error("PIPELINE THẤT BẠI CẤP ĐỘ HỆ THỐNG!", error);
    const failStatus = { status: { success: false, last_run: new Date().toISOString() }, errors: logger.getErrorLogs() };
    fs.writeFileSync(PIPELINE_STATUS_FILE, JSON.stringify(failStatus, null, 2));
    process.exit(1); // Ép tắt luồng để GitHub Actions nhận diện fail
});

// ============================================================================
// BÓP CÒ KHỞI ĐỘNG HỆ THỐNG
// ============================================================================
eventBus.emit('START_PIPELINE');

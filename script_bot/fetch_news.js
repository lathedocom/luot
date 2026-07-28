const eventBus = require('./core/event_bus');
const logger = require('./modules/utils/logger');
const fs = require('fs');
const path = require('path');

const PIPELINE_STATUS_FILE = path.join(__dirname, '../pipeline_status.json');

// IMPORT CÁC MODULE XỬ LÝ LÕI
const { buildDigest, buildRiskMapData } = require('./modules/digest/digest_builder');
const { processEventIntoTimeline } = require('./modules/6_timeline_manager');
const { processTopicIntoStory } = require('./modules/story/story_engine');
const { fetchAndNormalizeNews } = require('./modules/1_crawler');
const { extractCategories, getClusterCredibility } = require('./modules/rule_engine/category');
const { extractRegions } = require('./modules/rule_engine/region');
const { calculateImportance } = require('./modules/scoring/importance');
const { calculateValueScore } = require('./modules/scoring/value_score'); 
const { generateEmbeddings } = require('./modules/2_embedding');
const { clusterArticles } = require('./modules/3_clustering');
const { extractEntities } = require('./modules/4_nlp_entity');
const { buildGlobalGraph } = require('./modules/5_knowledge_graph');
const { analyzeClusterMultiDimensional } = require('./modules/5_ai_analysis');
const { generateEventKey, generateTopicKey } = require('./modules/topic/topic_key');
const topicStore = require('./modules/topic/topic_store');
const { mergeIntoExistingTopic } = require('./modules/topic/topic_merger');
const { evaluateClusterAction } = require('./modules/topic/similarity_engine');
const { fetchAllMarketData } = require('./modules/market/index');
const { fetchAllSocialTrends } = require('./modules/social/index');
const { generateAllReports } = require('./modules/reports/index');

const gateway = require('./modules/ai/gateway');
const { jaccardSimilarity } = require('./modules/utils/text_similarity');
const { cleanupCache } = require('./modules/cache/cache_manager');

// IMPORT CÁC MODULE MỚI VÀO ĐẦU FILE fetch_news.js
const { clusterArticlesIntoEvents } = require('./modules/events/cluster_events');
const { batchEnrichEvents } = require('./modules/events/enrich_events');
const { computeCountryIndices, computeGSI, computeMomentum, computeTrend, getMapColor, explainCountryColor } = require('./modules/index/compute_indices');

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
        // 1. Gán Category, Region và Tính điểm Importance ngay từ khi mới cào về
        const enriched = articles.map(article => {
            const cats = extractCategories(article.title + " " + article.summary);
            const regs = extractRegions(article.title + " " + article.summary, article.source_name);
            return {
                ...article,
                categories: cats,
                regions: regs,
                importance: calculateImportance(cats, regs)
            };
        });

        // 2. LỚP CHẶN TIẾT KIỆM QUOTA (Cực kỳ quan trọng)
        // Lọc bỏ ngay lập tức những tin tức rác, không thuộc 11 lĩnh vực quan tâm (< 50 điểm)
        const relevantArticles = enriched.filter(article => article.importance >= 50);

        logger.info(`[Tối ưu Quota] Đã lọc bỏ ${enriched.length - relevantArticles.length} tin rác. Chỉ mang ${relevantArticles.length} tin vĩ mô đi tạo Vector.`);

        state.articles = relevantArticles;
        
        // 3. Bây giờ chỉ Embedding những bài báo thực sự có giá trị
        const embedded = await generateEmbeddings(relevantArticles);
        eventBus.emit('EMBEDDING_DONE', embedded);
    } catch (e) {
        eventBus.emit('PIPELINE_ERROR', e);
    }
});

// THAY THẾ KHỐI XỬ LÝ EMBEDDING VÀ CLUSTER CŨ
eventBus.on('EMBEDDING_DONE', async (embeddedArticles) => {
    try {
        // Đọc Events cũ từ DB/File (Lưu file dạng events/active.json theo kiến trúc mới)
        const EVENT_FILE = path.join(__dirname, '../data/events/active.json');
        let existingEvents = [];
        if (fs.existsSync(EVENT_FILE)) {
            existingEvents = JSON.parse(fs.readFileSync(EVENT_FILE, 'utf-8'));
        }

        // Bước 3: Gom cụm bằng Toán học thuần túy
        const { newEvents, updatedEvents } = clusterArticlesIntoEvents(embeddedArticles, existingEvents);
        
        // Bước 4: Gọi 1 Batch AI duy nhất cho toàn bộ Event mới
        logger.info(`Đã gom được ${newEvents.length} Event mới. Đưa vào Batch Enrichment...`);
        const enrichedNewEvents = await batchEnrichEvents(newEvents);
        
        // Gộp Event cũ (đã được update số bài báo) và Event mới (đã có AI summary & Severity)
        state.currentTopics = [...updatedEvents, ...enrichedNewEvents];
        state.newTopicsCount = enrichedNewEvents.length;

        // Lưu đè lại file Active Events
        fs.mkdirSync(path.dirname(EVENT_FILE), { recursive: true });
        fs.writeFileSync(EVENT_FILE, JSON.stringify(state.currentTopics, null, 2));

        eventBus.emit('CLUSTER_CREATED', state.currentTopics);
    } catch (e) {
        eventBus.emit('PIPELINE_ERROR', e);
    }
});

eventBus.on('CLUSTER_CREATED', async (allEvents) => {
    try {
        // Bước 5 & 6 & 7: Tính toán Index Quốc Gia (Toàn bộ bằng Code thuần)
        logger.info('Bắt đầu tính toán Global Situation Index (GSI) cho từng quốc gia...');
        const countryGroups = {};
        allEvents.forEach(ev => {
            if (!countryGroups[ev.country]) countryGroups[ev.country] = [];
            countryGroups[ev.country].push(ev);
        });

        // Tải lịch sử GSI để tính Trend
        const HISTORY_DIR = path.join(__dirname, '../data/history/gsi');
        fs.mkdirSync(HISTORY_DIR, { recursive: true });

        const mapData = {}; // Chứa dữ liệu sẽ xuất ra cho Frontend
        const nowStr = new Date().toISOString();

        for (const country in countryGroups) {
            const cEvents = countryGroups[country];
            const indices = computeCountryIndices(cEvents);
            
            // Giả lập lấy event yesterday từ history (hiện tại gán cứng để khởi tạo)
            const momentum = computeMomentum(country, cEvents, cEvents); 
            const gsi = computeGSI(indices, momentum);

            // Đọc lịch sử để tính Trend
            const histFile = path.join(HISTORY_DIR, `${country}.json`);
            let hist = [];
            if (fs.existsSync(histFile)) hist = JSON.parse(fs.readFileSync(histFile, 'utf-8'));
            const trend = computeTrend(hist.map(h => h.gsi));
            hist.push({ date: nowStr, gsi: gsi });
            if (hist.length > 5) hist = hist.slice(-5); // Giữ 5 mốc
            fs.writeFileSync(histFile, JSON.stringify(hist));

            // Sinh dữ liệu giải thích màu (Tái sử dụng text của AI, không tốn API)
            const prevIndices = hist.length > 1 ? hist[hist.length-2].indices : indices;
            const explanation = explainCountryColor(country, cEvents, indices, prevIndices);

            mapData[country] = {
                gsi: gsi,
                indices: indices,
                ...getMapColor(gsi, trend), // level (green/yellow...), label, trend_icon
                explanation: explanation
            };
        }

        // Lưu JSON tĩnh cho frontend (indices_latest.json)
        const MAP_FILE = path.join(__dirname, '../data/countries/indices_latest.json');
        fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true });
        fs.writeFileSync(MAP_FILE, JSON.stringify(mapData, null, 2));

        logger.success(`Đã cập nhật bản đồ Global Situation cho ${Object.keys(mapData).length} quốc gia.`);
        
        eventBus.emit('TOPIC_UPDATED', allEvents);
    } catch (e) {
        eventBus.emit('PIPELINE_ERROR', e);
    }
});

eventBus.on('TOPIC_UPDATED', (currentTopics) => {
    logger.info("Khởi chạy song song (Asynchronous) các luồng dữ liệu vệ tinh...");
    fetchAllMarketData(currentTopics)
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
        
        db.news = filteredTopics.sort((a, b) => 
            (b.value_score || 0) - (a.value_score || 0) || b.timestamp - a.timestamp
        );
        
        db.news = db.news.map(t => ({
            ...t,
            timestamp: (t.timestamp && !isNaN(t.timestamp) && t.timestamp !== null) ? t.timestamp : Date.now()
        }));
        
        db.digest = buildDigest(db.news, { limitPerRegion: 7 });
        db.risk_map = buildRiskMapData(db.news);
        db.knowledge_graph = buildGlobalGraph(db.news);
        db.market_data = state.marketData || [];
        db.social_trends = state.socialTrends || [];
        
        // --- XỬ LÝ LƯU TRỮ LỊCH SỬ BẢN TIN 24H (TỐI ĐA 7 NGÀY) ---
        let briefingHistory = Array.isArray(db.daily_briefing) ? db.daily_briefing : [];
        if (typeof db.daily_briefing === 'string' && db.daily_briefing.trim() !== '') {
            briefingHistory = [{ date: new Date(Date.now() - 86400000).toISOString(), content: db.daily_briefing }];
        } else if (typeof db.daily_briefing === 'string') {
            briefingHistory = [];
        }

        const currentBriefingContent = (state.reports && state.reports.daily) ? state.reports.daily : "";
        const todayStr = new Date().toISOString().split('T')[0];
        const existingTodayIndex = briefingHistory.findIndex(b => b.date && b.date.startsWith(todayStr));

        if (existingTodayIndex !== -1) {
            briefingHistory[existingTodayIndex].content = currentBriefingContent;
            briefingHistory[existingTodayIndex].date = new Date().toISOString();
        } else {
            briefingHistory.unshift({ date: new Date().toISOString(), content: currentBriefingContent });
        }

        db.daily_briefing = briefingHistory.slice(0, 7);
        // ---------------------------------------------------------

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

const logger = require('./modules/utils/logger');
const { fetchAndNormalizeNews } = require('./modules/1_crawler');
const { extractCategories } = require('./modules/rule_engine/category');
const { extractRegions } = require('./modules/rule_engine/region');
const { calculateImportance } = require('./modules/scoring/importance');
const { generateEmbeddings } = require('./modules/2_embedding');
const { clusterArticles } = require('./modules/3_clustering');
const { extractEntities } = require('./modules/4_nlp_entity');
const { buildRuleBasedGraph } = require('./modules/5_knowledge_graph');
const { analyzeClusterMultiDimensional } = require('./modules/5_ai_analysis'); // Tích hợp module mới
const { generateEventKey, generateTopicKey } = require('./modules/topic/topic_key');
const topicStore = require('./modules/topic/topic_store');
const { mergeIntoExistingTopic } = require('./modules/topic/topic_merger');
const { fetchAllMarketData } = require('./modules/market/index');
const { fetchAllSocialTrends } = require('./modules/social/index');
const { generateAllReports } = require('./modules/reports/index');
const fs = require('fs');
const path = require('path');

const PIPELINE_STATUS_FILE = path.join(__dirname, '../pipeline_status.json');

async function runPipeline() {
    const startTime = Date.now();
    logger.clearErrorLogs();
    logger.info("=== KHỞI ĐỘNG HỆ THỐNG TIN TỨC INTELLIGENCE V4 ===");

    try {
        // 1. Crawler & Normalize
        let articles = await fetchAndNormalizeNews();

        // 2. Rule Engine & Scoring (Rule-based siêu tốc, không tốn AI quota)
        articles = articles.map(article => {
            const categories = extractCategories(article.title + " " + article.summary);
            const regions = extractRegions(article.title + " " + article.summary, article.source_name);
            const importance = calculateImportance(categories, regions, 1);
            return { ...article, categories, regions, importance };
        });

        // 3. Embedding & Clustering
        const embeddedArticles = await generateEmbeddings(articles);
        const clusters = clusterArticles(embeddedArticles);

        // 4. Load Database Cũ từ file tin tĩnh
        const db = topicStore.readData();
        let currentTopics = db.news || [];
        let newTopicsCount = 0;

        // 5. Xử lý từng cụm Sự Kiện (NLP -> Graph -> AI Intelligence Analysis)
        for (const cluster of clusters) {
            const entities = extractEntities(cluster.combined_text);
            const eventKey = generateEventKey(entities);
            const ruleGraph = buildRuleBasedGraph(entities);
            
            // So khớp xem sự kiện đã tồn tại trong dòng thời gian chưa
            const existingTopic = topicStore.findTopicByEventKey(eventKey, currentTopics);
            
            if (existingTopic) {
                // Sự kiện cũ: Nối thêm diễn biến vào mảng Timeline, không gọi AI phân tích lại toàn bộ
                const updatedTopic = mergeIntoExistingTopic(existingTopic, cluster.articles, cluster.articles[0].title);
                const index = currentTopics.findIndex(t => t.event_key === eventKey);
                currentTopics[index] = updatedTopic;
                logger.info(`Gộp diễn biến mới thành công vào Topic cũ: ${eventKey}`);
            } else {
                // Sự kiện mới hoàn toàn: Gọi module AI để bóc tách 9 lớp thông tin tình báo
                logger.info(`Đang chạy phân tích AI chuyên sâu cho cụm sự kiện mới...`);
                const aiIntelligence = await analyzeClusterMultiDimensional(cluster, eventKey);

                const newTopic = {
                    event_key: eventKey,
                    topic_key: generateTopicKey(eventKey, 'intelligence'),
                    title: aiIntelligence.cluster_title,
                    timestamp: cluster.timestamp,
                    importance: cluster.articles[0].importance,
                    hot_score: cluster.article_count * 10,
                    categories: cluster.articles[0].categories,
                    regions: cluster.articles[0].regions,
                    
                    // Nạp 9 trường dữ liệu cốt lõi chuẩn Schema V4 phục vụ Frontend Dashboard
                    short_summary: aiIntelligence.short_summary,
                    detailed_summary: aiIntelligence.detailed_summary,
                    causes: aiIntelligence.causes,
                    effects: aiIntelligence.effects,
                    affected_groups: aiIntelligence.affected_groups,
                    market_impact: aiIntelligence.market_impact,
                    follow_up: aiIntelligence.follow_up,
                    
                    entities: entities,
                    graph: ruleGraph,
                    sources: cluster.articles.map(a => ({ url: a.url, source_name: a.source_name, source_logo: a.source_logo })),
                    timeline: [{ title: aiIntelligence.cluster_title, timestamp: cluster.timestamp, url: cluster.articles[0].url }]
                };
                
                currentTopics.push(newTopic);
                newTopicsCount++;
                logger.success(`Đã tạo và nạp thành công Topic Intelligence mới: ${newTopic.title}`);
            }
        }

        // 6. Xử lý các luồng Thị trường, Mạng xã hội & Tổng hợp Báo cáo định kỳ
        logger.info("Đang tích hợp song song Market, Social và sinh bản tin Briefing...");
        const [marketData, socialTrends, reports] = await Promise.all([
            fetchAllMarketData(),
            fetchAllSocialTrends(),
            generateAllReports(currentTopics)
        ]);

        // 7. Đồng bộ vào cấu trúc JSON Tĩnh
       // Ưu tiên 1: Thời gian mới nhất. Ưu tiên 2: Độ nóng. (Giúp tin mới luôn lên đầu)
db.news = currentTopics.sort((a, b) => b.timestamp - a.timestamp || b.hot_score - a.hot_score);
        db.market_data = marketData;
        db.social_trends = socialTrends;
        db.daily_briefing = reports.daily || "";
        db.statistics = { total_topics: currentTopics.length, total_articles: articles.length };
        
        topicStore.writeData(db);

        // 8. Xuất trạng thái kiểm định Pipeline
        const durationMs = Date.now() - startTime;
        const status = {
            status: { success: true, duration_ms: durationMs, last_run: new Date().toISOString() },
            metrics: { articles_processed: articles.length, clusters_formed: clusters.length, new_topics: newTopicsCount },
            quota: { embedding_calls: articles.length },
            errors: logger.getErrorLogs()
        };
        fs.writeFileSync(PIPELINE_STATUS_FILE, JSON.stringify(status, null, 2));
        
        logger.success(`=== PIPELINE HOÀN TẤT TUYỆT ĐỐI SAU ${durationMs}ms ===`);

    } catch (error) {
        logger.error("PIPELINE THẤT BẠI CẤP ĐỘ HỆ THỐNG!", error);
        const failStatus = { status: { success: false, last_run: new Date().toISOString() }, errors: logger.getErrorLogs() };
        fs.writeFileSync(PIPELINE_STATUS_FILE, JSON.stringify(failStatus, null, 2));
    }
}

runPipeline();

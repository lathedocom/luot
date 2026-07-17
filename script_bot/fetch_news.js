const logger = require('./modules/utils/logger');
const { fetchAndNormalizeNews } = require('./modules/1_crawler');
const { extractCategories } = require('./modules/rule_engine/category');
const { extractRegions } = require('./modules/rule_engine/region');
const { calculateImportance } = require('./modules/scoring/importance');
const { generateEmbeddings } = require('./modules/2_embedding');
const { clusterArticles } = require('./modules/3_clustering');
const { extractEntities } = require('./modules/4_nlp_entity');
const { buildRuleBasedGraph } = require('./modules/5_knowledge_graph');
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
    logger.info("=== KHỞI ĐỘNG HỆ THỐNG TIN TỨC V4 ===");

    try {
        // 1. Crawler & Normalize
        let articles = await fetchAndNormalizeNews();

        // 2. Rule Engine & Scoring (Không dùng AI)
        articles = articles.map(article => {
            const categories = extractCategories(article.title + " " + article.summary);
            const regions = extractRegions(article.title + " " + article.summary, article.source_name);
            const importance = calculateImportance(categories, regions, 1);
            return { ...article, categories, regions, importance };
        });

        // 3. Embedding & Clustering
        const embeddedArticles = await generateEmbeddings(articles);
        const clusters = clusterArticles(embeddedArticles);

        // 4. Load Database Cũ
        const db = topicStore.readData();
        let currentTopics = db.news || [];
        let newTopicsCount = 0;

        // 5. Xử lý từng cụm Sự Kiện (NLP -> Graph -> AI Analysis)
        for (const cluster of clusters) {
            const entities = extractEntities(cluster.combined_text);
            const eventKey = generateEventKey(entities);
            const ruleGraph = buildRuleBasedGraph(entities);
            
            // So khớp Timeline
            const existingTopic = topicStore.findTopicByEventKey(eventKey, currentTopics);
            
            if (existingTopic) {
                // Update sự kiện cũ
                const updatedTopic = mergeIntoExistingTopic(existingTopic, cluster.articles, cluster.articles[0].title);
                const index = currentTopics.findIndex(t => t.event_key === eventKey);
                currentTopics[index] = updatedTopic;
                logger.info(`Đã nối thêm diễn biến vào Topic cũ: ${eventKey}`);
            } else {
                // Tạo Topic mới
                const newTopic = {
                    event_key: eventKey,
                    topic_key: generateTopicKey(eventKey, 'new_event'),
                    title: cluster.articles[0].title,
                    timestamp: cluster.timestamp,
                    importance: cluster.articles[0].importance,
                    hot_score: cluster.article_count * 10,
                    categories: cluster.articles[0].categories,
                    regions: cluster.articles[0].regions,
                    short_summary: cluster.articles[0].summary,
                    entities: entities,
                    graph: ruleGraph,
                    sources: cluster.articles.map(a => ({ url: a.url, source_name: a.source_name, source_logo: a.source_logo })),
                    timeline: [{ title: cluster.articles[0].title, timestamp: cluster.timestamp, url: cluster.articles[0].url }]
                };
                currentTopics.push(newTopic);
                newTopicsCount++;
                logger.success(`Đã tạo Topic mới: ${newTopic.title}`);
            }
        }

        // 6. Xử lý Market, Social & Reports (Chạy song song)
        logger.info("Đang tải dữ liệu Market, Social và sinh Reports...");
        const [marketData, socialTrends, reports] = await Promise.all([
            fetchAllMarketData(),
            fetchAllSocialTrends(),
            generateAllReports(currentTopics)
        ]);

        // 7. Ghi vào JSON Chính
        db.news = currentTopics.sort((a, b) => b.hot_score - a.hot_score); // Xếp bài Hot lên đầu
        db.market_data = marketData;
        db.social_trends = socialTrends;
        db.daily_briefing = reports.daily || "";
        db.statistics = { total_topics: currentTopics.length, total_articles: articles.length };
        
        topicStore.writeData(db);

        // 8. Ghi file pipeline_status.json
        const durationMs = Date.now() - startTime;
        const status = {
            status: { success: true, duration_ms: durationMs, last_run: new Date().toISOString() },
            metrics: { articles_processed: articles.length, clusters_formed: clusters.length, new_topics: newTopicsCount },
            quota: { gemini_calls_estimated: clusters.length * 2, embedding_calls: articles.length },
            errors: logger.getErrorLogs()
        };
        fs.writeFileSync(PIPELINE_STATUS_FILE, JSON.stringify(status, null, 2));
        
        logger.success(`=== PIPELINE HOÀN TẤT SAU ${durationMs}ms ===`);

    } catch (error) {
        logger.error("PIPELINE THẤT BẠI TẠI LỖI CHÍNH!", error);
        const failStatus = { status: { success: false, last_run: new Date().toISOString() }, errors: logger.getErrorLogs() };
        fs.writeFileSync(PIPELINE_STATUS_FILE, JSON.stringify(failStatus, null, 2));
    }
}

// Kích hoạt chạy
runPipeline();

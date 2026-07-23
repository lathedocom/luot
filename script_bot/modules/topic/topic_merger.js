const { addEventToTimeline } = require('./timeline_manager');
const { calculateValueScore } = require('../scoring/value_score');
const { getClusterCredibility } = require('../rule_engine/category');

function mergeIntoExistingTopic(existingTopic, newArticles, newActionTitle) {
    let updatedTopic = { ...existingTopic };
    
    const toTimestamp = (t) => {
        if (!t) return Date.now();
        const ms = new Date(t).getTime();
        return isNaN(ms) ? Date.now() : ms;
    };
    
    const latestArticleTime = Math.max(...newArticles.map(a => toTimestamp(a.publish_time)));
    
    // 1. Cập nhật thời gian mới nhất cho Cụm
    updatedTopic.timestamp = latestArticleTime;
    updatedTopic.last_updated = Date.now();
    
    // 2. Tăng số đếm cập nhật lên 1 (Lớp 3 - Độ mới)
    updatedTopic.update_count = (updatedTopic.update_count || 1) + 1;
    
    // 3. Gộp thêm nguồn bài báo mới (Tránh trùng lặp URL)
    const currentSources = updatedTopic.sources || [];
    const incomingSources = newArticles.map(a => ({ 
        url: a.link || a.url, 
        source_name: a.source_name, 
        source_logo: a.source_logo,
        source_credibility: a.source_credibility || 5
    }));
    
    const allSources = [...currentSources, ...incomingSources];
    // Lọc unique dựa theo thuộc tính URL
    updatedTopic.sources = Array.from(new Map(allSources.map(item => [item.url, item])).values());
    
    // 4. Tăng điểm Hot Score phụ (Legacy)
    updatedTopic.hot_score = (updatedTopic.hot_score || 0) + (newArticles.length * 5);
    
    // 5. Tính toán lại Value Score 
    const avgCred = getClusterCredibility({ articles: updatedTopic.sources });
    const PRIORITY_FIELDS = ['money','economy','finance','trade','investment','tech','science','politics','policy','law','military'];
    const matchedPriorityCount = (updatedTopic.categories || []).filter(c => PRIORITY_FIELDS.includes(c)).length || 1;

    updatedTopic.value_score = calculateValueScore({
        importance: updatedTopic.importance || 70,
        scope: updatedTopic.scope || 'business',
        credibilityAvg: avgCred,
        matchedPriorityCount: matchedPriorityCount,
        updateCount: updatedTopic.update_count
    });

    // 6. Thêm tình tiết mới vào Timeline
    if (newArticles.length > 0) {
        updatedTopic = addEventToTimeline(
            updatedTopic,
            newActionTitle || newArticles[0].title,
            latestArticleTime,
            newArticles[0].url || newArticles[0].link
        );
    }
    
    return updatedTopic;
}

module.exports = { mergeIntoExistingTopic };

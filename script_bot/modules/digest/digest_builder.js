// FILE: script_bot/modules/digest/digest_builder.js

function buildDigest(allTopics, { limitPerRegion = 7, windowMs = 48 * 60 * 60 * 1000 } = {}) {
    const now = Date.now();
    const recentTopics = allTopics.filter(t => {
        const topicTime = t.last_updated || t.timestamp || 0;
        return (now - topicTime) <= windowMs;
    });

    const buckets = { vietnam: [], asia: [], global: [] };
    const ASIA_REGIONS = ['china', 'asean', 'asia'];

    recentTopics.forEach(t => {
        const regions = t.regions || [];
        if (regions.includes('vietnam')) {
            buckets.vietnam.push(t);
        } else if (regions.some(r => ASIA_REGIONS.includes(r))) {
            buckets.asia.push(t);
        } else {
            buckets.global.push(t);
        }
    });

    const mapLightweight = (t) => ({
        event_key: t.event_key,
        title: t.title || t.cluster_title,
        short_summary: t.short_summary,
        value_score: t.value_score,
        timestamp: t.timestamp,
        last_updated: t.last_updated,
        update_count: t.update_count,
        regions: t.regions,
        sources_count: (t.sources || []).length
    });

    const topN = (arr) => arr
        .sort((a, b) => (b.value_score || 0) - (a.value_score || 0))
        .slice(0, limitPerRegion)
        .map(mapLightweight);

    return { vietnam: topN(buckets.vietnam), asia: topN(buckets.asia), global: topN(buckets.global), generated_at: Date.now() };
}

// =====================================================================
// SITUATION INDEX ENGINE
// =====================================================================

const REGION_TO_ISO = {
    'vietnam': ['VN'], 'usa': ['US'], 'canada': ['CA'],
    'china': ['CN', 'TW', 'HK'], 
    'eu': ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'CH', 'SE', 'PL'], 
    'russia_ukraine': ['RU', 'UA', 'BY'],
    'asean': ['SG', 'TH', 'MY', 'ID', 'PH', 'KH', 'LA', 'MM', 'BN'], 
    'asia': ['JP', 'KR', 'IN', 'PK', 'BD', 'LK'],
    'middle_east': ['IL', 'PS', 'IR', 'SY', 'LB', 'SA', 'AE', 'QA', 'IQ', 'YE'],
    'oceania': ['AU', 'NZ'], 
    'latin_america': ['BR', 'AR', 'MX', 'CO', 'CL', 'PE', 'VE'], 
    'africa': ['ZA', 'GH', 'NG', 'EG', 'KE', 'ET'],
    // Gán các tin tức Toàn cầu (Global) tác động lên các cường quốc đại diện
    'global': ['US', 'CN', 'RU', 'GB', 'FR', 'DE', 'JP', 'IN'] 
};

const CATEGORY_WEIGHTS = { 'military': 2.5, 'health': 2.0, 'disaster': 2.2, 'economy': 1.0, 'politics': 1.4, 'default': 1.0 };
const IMPACT_TO_SEVERITY = { 'crisis': 5, 'risk': 4, 'monitor': 2, 'development': 1 };

function getLayerName(categories) {
    if (!categories || categories.length === 0) return 'general';
    const catStr = categories.join(' ').toLowerCase();
    if (catStr.includes('quân sự') || catStr.includes('xung đột') || catStr.includes('chiến tranh') || catStr.includes('military')) return 'security';
    if (catStr.includes('kinh tế') || catStr.includes('tài chính') || catStr.includes('doanh nghiệp') || catStr.includes('economy')) return 'economy';
    if (catStr.includes('môi trường') || catStr.includes('thiên tai') || catStr.includes('environment')) return 'disaster';
    if (catStr.includes('y tế') || catStr.includes('sức khỏe') || catStr.includes('health')) return 'health';
    return 'general';
}

function buildSituationIndexData(topics, previousData = {}) {
    const regionData = {};
    const now = Date.now();

    topics.forEach(topic => {
        const daysOld = (now - (topic.timestamp || now)) / (1000 * 60 * 60 * 24);
        const decay = Math.max(0.15, 1 - (daysOld * 0.15));

        const layer = getLayerName(topic.categories);
        let weight = CATEGORY_WEIGHTS['default'];
        if (layer === 'security') weight = CATEGORY_WEIGHTS['military'];
        else if (layer === 'economy') weight = CATEGORY_WEIGHTS['economy'];
        else if (layer === 'disaster') weight = CATEGORY_WEIGHTS['disaster'];
        else if (layer === 'health') weight = CATEGORY_WEIGHTS['health'];

        let severity = topic.severity;
        if (!severity && topic.impact_level) severity = IMPACT_TO_SEVERITY[topic.impact_level];
        if (!severity) severity = 3; 
        
        let sentiment = topic.sentiment !== undefined ? topic.sentiment : -1;
        // Tránh lỗi nhân với 0 khi sự kiện trung lập
        let sentimentMultiplier = sentiment === 0 ? 0.5 : sentiment;

        if (topic.scope === 'global') severity += 1;

        const rawScore = severity * weight * sentimentMultiplier * decay;
        if (Math.abs(rawScore) < 0.1) return; // Bỏ qua rác siêu nhỏ

        if (topic.regions && topic.regions.length > 0) {
            topic.regions.forEach(regionId => {
                const isoCodes = REGION_TO_ISO[regionId] || [];
                isoCodes.forEach(iso => {
                    if (!regionData[iso]) regionData[iso] = { events: [] };
                    regionData[iso].events.push({
                        title: topic.title || topic.cluster_title,
                        score: rawScore,
                        layer: layer,
                        sentiment: sentiment
                    });
                });
            });
        }
    });

    const finalMapData = {};

    for (const [isoCode, data] of Object.entries(regionData)) {
        data.events.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
        const top5 = data.events.slice(0, 5);

        const layerScores = { total: 0, security: 0, economy: 0, disaster: 0, health: 0, general: 0 };
        top5.forEach(evt => {
            layerScores.total += evt.score;
            layerScores[evt.layer] += evt.score;
        });

        const previousSI = previousData[isoCode] || { layers: { total: 0, security: 0, economy: 0, disaster: 0, health: 0, general: 0 } };
        const finalLayers = {};
        
        for (let l in layerScores) {
            finalLayers[l] = (0.3 * layerScores[l]) + (0.7 * (previousSI.layers && previousSI.layers[l] ? previousSI.layers[l] : 0));
        }

        const volatility = Math.abs(finalLayers.total);
        let status = 'Ổn định', color = '#22c55e'; 
        if (volatility > 8) { status = 'Diễn biến nghiêm trọng'; color = '#ef4444'; } 
        else if (volatility > 5) { status = 'Diễn biến phức tạp'; color = '#f97316'; } 
        else if (volatility > 2) { status = 'Cần theo dõi'; color = '#eab308'; } 

        finalMapData[isoCode] = {
            status: status,
            color: color,
            si_score: parseFloat(finalLayers.total.toFixed(2)),
            layers: finalLayers, 
            events: top5.map(e => ({ title: e.title, score: parseFloat(e.score.toFixed(2)), sentiment: e.sentiment }))
        };
    }

    return finalMapData;
}

module.exports = { buildDigest, buildSituationIndexData };

const CATEGORY_WEIGHT = {
    'Chiến tranh': 1.0, 'Quân sự': 0.85, 'Thiên tai': 0.8,
    'Dịch bệnh': 0.85, 'Chính trị': 0.6, 'Ngoại giao': 0.5,
    'Kinh tế': 0.55, 'Thị trường tài chính': 0.5, 'Biểu tình': 0.6,
    'An ninh mạng': 0.5, 'Năng lượng': 0.55, 'Chuỗi cung ứng': 0.5,
    'Công nghệ': 0.3, 'Xã hội': 0.35, 'Khí hậu': 0.6, 'Giao thông': 0.4
};

const CASUALTY_SCORE = { none: 0, few: 2, dozens: 4, hundreds: 7, mass: 10 };
const SCOPE_SCORE = { local: 2, national: 5, regional: 7, global: 10 };
const INDEX_WEIGHT = { security: 0.25, economy: 0.20, politics: 0.15, disaster: 0.15, health: 0.10, society: 0.05, technology: 0.10 };

const GROUP_TO_INDEX = {
    'Chiến tranh': 'security', 'Quân sự': 'security', 'An ninh mạng': 'security',
    'Kinh tế': 'economy', 'Thị trường tài chính': 'economy', 'Năng lượng': 'economy', 'Chuỗi cung ứng': 'economy',
    'Chính trị': 'politics', 'Ngoại giao': 'politics', 'Biểu tình': 'politics',
    'Thiên tai': 'disaster', 'Khí hậu': 'disaster',
    'Dịch bệnh': 'health',
    'Xã hội': 'society', 'Giao thông': 'society',
    'Công nghệ': 'technology'
};

const DECAY_CURVE = [
    { days: 0, weight: 1.00 }, { days: 1, weight: 0.80 },
    { days: 2, weight: 0.65 }, { days: 3, weight: 0.50 },
    { days: 5, weight: 0.30 }, { days: 7, weight: 0.15 },
];

function getDecayWeight(occurredAt) {
    const daysElapsed = (Date.now() - new Date(occurredAt).getTime()) / (1000 * 3600 * 24);
    if (daysElapsed <= 0) return 1.0;
    if (daysElapsed >= 7) return Math.max(0.15 * Math.exp(-0.25 * (daysElapsed - 7)), 0.02);
    
    for (let i = 0; i < DECAY_CURVE.length - 1; i++) {
        const [a, b] = [DECAY_CURVE[i], DECAY_CURVE[i + 1]];
        if (daysElapsed >= a.days && daysElapsed <= b.days) {
            const ratio = (daysElapsed - a.days) / (b.days - a.days);
            return a.weight + (b.weight - a.weight) * ratio;
        }
    }
    return 0.15;
}

function computeSeverity(eventData, sourceCount) {
    const base = (CASUALTY_SCORE[eventData.casualties_scale] || 0) * 0.35 +
                 (SCOPE_SCORE[eventData.geo_scope] || 0) * 0.30 +
                 (eventData.is_escalating_language ? 2 : 0) +
                 Math.min(sourceCount, 10) * 0.3;

    const weighted = base * (CATEGORY_WEIGHT[eventData.category] || 0.5);
    return Math.round(Math.min(weighted, 10) * 10) / 10;
}

function computeMomentum(country, eventsToday, eventsYesterday) {
    const todayWeighted = eventsToday.filter(e => e.country === country).reduce((sum, e) => sum + e.severity, 0);
    const yesterdayWeighted = eventsYesterday.filter(e => e.country === country).reduce((sum, e) => sum + e.severity, 0);

    if (yesterdayWeighted === 0) return todayWeighted > 0 ? 2.0 : 0;
    const ratio = (todayWeighted - yesterdayWeighted) / yesterdayWeighted;
    return Math.max(-2, Math.min(2, ratio)); // Chặn trong khoảng [-2, 2]
}

function computeTrend(indexHistory) {
    if (!indexHistory || indexHistory.length < 2) return 'stable';
    const prev = indexHistory[indexHistory.length - 2];
    const curr = indexHistory[indexHistory.length - 1];
    const delta = curr - prev;
    if (delta > 0.5) return 'worsening';
    if (delta < -0.5) return 'cooling';
    return 'stable';
}

function computeCountryIndices(countryEvents) {
    const indices = { security: 0, economy: 0, politics: 0, disaster: 0, health: 0, society: 0, technology: 0 };
    const counts  = { ...indices };

    for (const e of countryEvents) {
        const idx = GROUP_TO_INDEX[e.category];
        if (!idx) continue;
        const eff = e.severity * getDecayWeight(e.occurred_at) * (e.confidence || 1);
        indices[idx] += eff;
        counts[idx] += 1;
    }

    for (const key of Object.keys(indices)) {
        indices[key] = counts[key] === 0 ? 0 : Math.round(Math.min(10, Math.log2(indices[key] + 1) * 2.2) * 10) / 10;
    }
    return indices;
}

function computeGSI(indices, momentum) {
    const weighted = Object.entries(INDEX_WEIGHT).reduce((sum, [key, w]) => sum + indices[key] * w, 0);
    const momentumBoost = Math.max(0, momentum) * 0.5;
    return Math.round(Math.min(10, Math.max(0, weighted + momentumBoost)) * 10) / 10;
}

function getMapColor(gsi, trend) {
    let level;
    if (gsi < 3) level = 'green';
    else if (gsi < 5) level = 'yellow';
    else if (gsi < 7.5) level = 'orange';
    else level = 'red';

    return {
        level,
        label: { green: 'Ổn định', yellow: 'Có diễn biến đáng chú ý', orange: 'Biến động đáng kể', red: 'Biến động nghiêm trọng' }[level],
        trend_icon: { worsening: '⬆', stable: '➡', cooling: '⬇' }[trend] || '➡'
    };
}

function explainCountryColor(country, events, indices, prevIndices) {
    const top5 = events
        .filter(e => e.country === country && e.status === 'active')
        .sort((a, b) => (b.severity * getDecayWeight(b.occurred_at)) - (a.severity * getDecayWeight(a.occurred_at)))
        .slice(0, 5);

    let biggestJump = { key: 'none', delta: 0 };
    if (prevIndices) {
        biggestJump = Object.keys(indices)
            .map(k => ({ key: k, delta: indices[k] - (prevIndices[k] || 0) }))
            .sort((a, b) => b.delta - a.delta)[0];
    }

    return {
        top_events: top5.map(e => ({ id: e.id, title: e.title, severity: e.severity, summary: e.summary_ai, impact_vn: e.impact_vn })),
        biggest_index_change: biggestJump,
        narrative: top5.length
            ? `Điểm biến động chủ yếu đến từ: ${top5[0].title}${top5[1] ? ' và ' + top5[1].title : ''}. ${top5[0].summary_ai}`
            : 'Không có sự kiện đáng chú ý.'
    };
}

module.exports = { getDecayWeight, computeSeverity, computeMomentum, computeTrend, computeCountryIndices, computeGSI, getMapColor, explainCountryColor };

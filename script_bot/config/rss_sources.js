// FILE: script_bot/config/rss_sources.js

const RSS_SOURCES = [
    // ==========================================
    // 1. VIỆT NAM (Ưu tiên cao)
    // ==========================================
    {
        id: "vnexpress_world",
        name: "VnExpress",
        country: "Vietnam",
        region: "Southeast Asia",
        language: "vi",
        category: ["general", "world"],
        type: "newspaper",
        priority: 10,
        credibility: 9,
        rss: "https://vnexpress.net/rss/the-gioi.rss",
        homepage: "https://vnexpress.net",
        logo: "https://vnexpress.net/favicon.ico",
        enabled: true
    },
    {
        id: "vneconomy_macro",
        name: "VnEconomy",
        country: "Vietnam",
        region: "Southeast Asia",
        language: "vi",
        category: ["economy", "finance", "macro"],
        type: "economic_news",
        priority: 9,
        credibility: 9,
        rss: "https://vneconomy.vn/rss/kinh-te-vi-mo.rss",
        homepage: "https://vneconomy.vn",
        logo: "https://vneconomy.vn/favicon.ico",
        enabled: true
    },
    // ==========================================
    // 2. ASEAN
    // ==========================================
    {
        id: "cna_asia",
        name: "CNA",
        country: "Singapore",
        region: "Southeast Asia",
        language: "en",
        category: ["general", "asia"],
        type: "news_agency",
        priority: 9,
        credibility: 9,
        rss: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511",
        homepage: "https://www.channelnewsasia.com",
        logo: "https://www.channelnewsasia.com/favicon.ico",
        enabled: true
    },
    // ==========================================
    // 3. TRUNG QUỐC
    // ==========================================
    {
        id: "xinhua_world",
        name: "Xinhua",
        country: "China",
        region: "East Asia",
        language: "en",
        category: ["general", "politics"],
        type: "news_agency",
        priority: 10,
        credibility: 8,
        rss: "http://www.xinhuanet.com/english/rss/worldrss.xml",
        homepage: "http://www.xinhuanet.com/english/",
        logo: "http://www.xinhuanet.com/favicon.ico",
        enabled: true
    },
    // ==========================================
    // 9. CHÂU ÂU
    // ==========================================
    {
        id: "bbc_world",
        name: "BBC News",
        country: "UK",
        region: "Europe",
        language: "en",
        category: ["general", "world"],
        type: "news_agency",
        priority: 10,
        credibility: 10,
        rss: "http://feeds.bbci.co.uk/news/world/rss.xml",
        homepage: "https://www.bbc.com/news",
        logo: "https://www.bbc.co.uk/favicon.ico",
        enabled: true
    },
    // ==========================================
    // 12. HOA KỲ
    // ==========================================
    {
        id: "cnbc_finance",
        name: "CNBC",
        country: "USA",
        region: "North America",
        language: "en",
        category: ["economy", "finance", "markets"],
        type: "economic_news",
        priority: 10,
        credibility: 9,
        rss: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664",
        homepage: "https://www.cnbc.com",
        logo: "https://www.cnbc.com/favicon.ico",
        enabled: true
    },
    // ==========================================
    // 18. TỔ CHỨC QUỐC TẾ
    // ==========================================
    {
        id: "who_news",
        name: "WHO",
        country: "Global",
        region: "Global",
        language: "en",
        category: ["health", "science"],
        type: "international_org",
        priority: 10,
        credibility: 10,
        rss: "https://www.who.int/rss-feeds/news-english.xml",
        homepage: "https://www.who.int",
        logo: "https://www.who.int/favicon.ico",
        enabled: true
    }
];

module.exports = { RSS_SOURCES };

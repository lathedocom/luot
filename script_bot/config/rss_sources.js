// FILE: script_bot/config/rss_sources.js

const RSS_SOURCES = [
    // ==========================================
    // 1. VIỆT NAM (Ưu tiên cao - Credibility 9-10)
    // ==========================================
    {
        id: "vnexpress_world", name: "VnExpress", country: "Vietnam", region: "Southeast Asia", language: "vi",
        category: ["general", "world"], type: "newspaper", priority: 10, credibility: 9,
        rss: "https://vnexpress.net/rss/the-gioi.rss", homepage: "https://vnexpress.net", logo: "https://s1.vnecdn.net/vnexpress/restruct/i/v863/v2_2019/pc/graphics/favicon.ico", enabled: true
    },
    {
        id: "tuoitre_world", name: "Tuổi Trẻ", country: "Vietnam", region: "Southeast Asia", language: "vi",
        category: ["general", "world"], type: "newspaper", priority: 10, credibility: 9,
        rss: "https://tuoitre.vn/rss/the-gioi.rss", homepage: "https://tuoitre.vn", logo: "https://tuoitre.vn/favicon.ico", enabled: true
    },
    {
        id: "thanhnien_world", name: "Thanh Niên", country: "Vietnam", region: "Southeast Asia", language: "vi",
        category: ["general", "world"], type: "newspaper", priority: 10, credibility: 9,
        rss: "https://thanhnien.vn/rss/the-gioi.rss", homepage: "https://thanhnien.vn", logo: "https://thanhnien.vn/favicon.ico", enabled: true
    },
    {
        id: "vietnamnet_world", name: "VietnamNet", country: "Vietnam", region: "Southeast Asia", language: "vi",
        category: ["general", "politics"], type: "newspaper", priority: 10, credibility: 9,
        rss: "https://vietnamnet.vn/rss/the-gioi.rss", homepage: "https://vietnamnet.vn", logo: "https://vietnamnet.vn/favicon.ico", enabled: true
    },
    {
        id: "vtv_news", name: "VTV News", country: "Vietnam", region: "Southeast Asia", language: "vi",
        category: ["general", "politics"], type: "state_media", priority: 10, credibility: 10,
        rss: "https://vtv.vn/rss/the-gioi.rss", homepage: "https://vtv.vn", logo: "https://vtv.vn/favicon.ico", enabled: true
    },
    {
        id: "cafef_macro", name: "CafeF", country: "Vietnam", region: "Southeast Asia", language: "vi",
        category: ["economy", "finance", "macro"], type: "economic_news", priority: 9, credibility: 8,
        rss: "https://cafef.vn/kinh-te-vi-mo-dau-tu.rss", homepage: "https://cafef.vn", logo: "https://cafef.vn/favicon.ico", enabled: true
    },

    // ==========================================
    // 2. ASEAN (Đông Nam Á)
    // ==========================================
    {
        id: "cna_asia", name: "CNA", country: "Singapore", region: "Southeast Asia", language: "en",
        category: ["general", "asia"], type: "news_agency", priority: 9, credibility: 9,
        rss: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511", homepage: "https://www.channelnewsasia.com", logo: "https://www.channelnewsasia.com/favicon.ico", enabled: true
    },
    {
        id: "thestar_my", name: "The Star", country: "Malaysia", region: "Southeast Asia", language: "en",
        category: ["general"], type: "newspaper", priority: 8, credibility: 8,
        rss: "https://www.thestar.com.my/rss/news/regional", homepage: "https://www.thestar.com.my", logo: "https://www.thestar.com.my/favicon.ico", enabled: true
    },
    {
        id: "jakartapost_id", name: "Jakarta Post", country: "Indonesia", region: "Southeast Asia", language: "en",
        category: ["general", "politics"], type: "newspaper", priority: 9, credibility: 8,
        rss: "https://www.thejakartapost.com/news/asia/rss", homepage: "https://www.thejakartapost.com", logo: "https://www.thejakartapost.com/favicon.ico", enabled: true
    },
    {
        id: "bangkokpost_th", name: "Bangkok Post", country: "Thailand", region: "Southeast Asia", language: "en",
        category: ["general", "economy"], type: "newspaper", priority: 8, credibility: 8,
        rss: "https://www.bangkokpost.com/rss/data/topstories.xml", homepage: "https://www.bangkokpost.com", logo: "https://www.bangkokpost.com/favicon.ico", enabled: true
    },

    // ==========================================
    // 3. TRUNG QUỐC & HỒNG KÔNG & ĐÀI LOAN
    // ==========================================
    {
        id: "xinhua_world", name: "Xinhua", country: "China", region: "East Asia", language: "en",
        category: ["general", "politics"], type: "state_media", priority: 10, credibility: 8,
        rss: "http://www.xinhuanet.com/english/rss/worldrss.xml", homepage: "http://www.xinhuanet.com/english/", logo: "http://www.xinhuanet.com/favicon.ico", enabled: true
    },
    {
        id: "scmp_hk", name: "South China Morning Post", country: "Hong Kong", region: "East Asia", language: "en",
        category: ["economy", "politics", "asia"], type: "newspaper", priority: 9, credibility: 9,
        rss: "https://www.scmp.com/rss/91/feed", homepage: "https://www.scmp.com", logo: "https://www.scmp.com/favicon.ico", enabled: true
    },
    {
        id: "globaltimes_cn", name: "Global Times", country: "China", region: "East Asia", language: "en",
        category: ["general", "politics"], type: "state_media", priority: 8, credibility: 7,
        rss: "https://www.globaltimes.cn/rss/world.xml", homepage: "https://www.globaltimes.cn", logo: "https://www.globaltimes.cn/favicon.ico", enabled: true
    },

    // ==========================================
    // 4. NHẬT BẢN & HÀN QUỐC
    // ==========================================
    {
        id: "nhk_world", name: "NHK World", country: "Japan", region: "East Asia", language: "en",
        category: ["general", "politics", "economy"], type: "state_media", priority: 10, credibility: 10,
        rss: "https://www3.nhk.or.jp/nhkworld/upld/medias/en/radio/podcast/rss_latest_news.xml", homepage: "https://www3.nhk.or.jp/nhkworld/", logo: "https://www3.nhk.or.jp/favicon.ico", enabled: true
    },
    {
        id: "nikkei_asia", name: "Nikkei Asia", country: "Japan", region: "East Asia", language: "en",
        category: ["economy", "finance", "business"], type: "economic_news", priority: 10, credibility: 10,
        rss: "https://asia.nikkei.com/rss/feed/category/Politics-Economy", homepage: "https://asia.nikkei.com", logo: "https://asia.nikkei.com/favicon.ico", enabled: true
    },
    {
        id: "yonhap_kr", name: "Yonhap", country: "South Korea", region: "East Asia", language: "en",
        category: ["general", "politics"], type: "news_agency", priority: 9, credibility: 9,
        rss: "https://en.yna.co.kr/RSS/news.xml", homepage: "https://en.yna.co.kr", logo: "https://en.yna.co.kr/favicon.ico", enabled: true
    },

    // ==========================================
    // 9. CHÂU ÂU
    // ==========================================
    {
        id: "bbc_world", name: "BBC News", country: "UK", region: "Europe", language: "en",
        category: ["general", "world"], type: "state_media", priority: 10, credibility: 10,
        rss: "http://feeds.bbci.co.uk/news/world/rss.xml", homepage: "https://www.bbc.com/news", logo: "https://www.bbc.co.uk/favicon.ico", enabled: true
    },
    {
        id: "dw_germany", name: "DW (Deutsche Welle)", country: "Germany", region: "Europe", language: "en",
        category: ["general", "politics"], type: "state_media", priority: 9, credibility: 9,
        rss: "https://rss.dw.com/rdf/rss-en-world", homepage: "https://www.dw.com", logo: "https://www.dw.com/favicon.ico", enabled: true
    },
    {
        id: "france24_fr", name: "France24", country: "France", region: "Europe", language: "en",
        category: ["general", "world"], type: "state_media", priority: 9, credibility: 9,
        rss: "https://www.france24.com/en/rss", homepage: "https://www.france24.com", logo: "https://www.france24.com/favicon.ico", enabled: true
    },
    {
        id: "politico_eu", name: "Politico Europe", country: "Belgium", region: "Europe", language: "en",
        category: ["politics", "policy"], type: "newspaper", priority: 10, credibility: 9,
        rss: "https://www.politico.eu/feed/", homepage: "https://www.politico.eu", logo: "https://www.politico.eu/favicon.ico", enabled: true
    },

    // ==========================================
    // 10. NGA & UKRAINE
    // ==========================================
    {
        id: "tass_ru", name: "TASS", country: "Russia", region: "Eastern Europe", language: "en",
        category: ["politics", "world"], type: "state_media", priority: 9, credibility: 7,
        rss: "https://tass.com/rss/v2.xml", homepage: "https://tass.com", logo: "https://tass.com/favicon.ico", enabled: true
    },
    {
        id: "kyivindependent_ua", name: "Kyiv Independent", country: "Ukraine", region: "Eastern Europe", language: "en",
        category: ["politics", "conflict"], type: "newspaper", priority: 9, credibility: 8,
        rss: "https://kyivindependent.com/rss/", homepage: "https://kyivindependent.com", logo: "https://kyivindependent.com/favicon.ico", enabled: true
    },

    // ==========================================
    // 12. HOA KỲ
    // ==========================================
    {
        id: "nyt_world", name: "New York Times", country: "USA", region: "North America", language: "en",
        category: ["general", "world"], type: "newspaper", priority: 10, credibility: 9,
        rss: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", homepage: "https://www.nytimes.com", logo: "https://www.nytimes.com/favicon.ico", enabled: true
    },
    {
        id: "wsj_world", name: "Wall Street Journal", country: "USA", region: "North America", language: "en",
        category: ["economy", "politics"], type: "newspaper", priority: 10, credibility: 9,
        rss: "https://feeds.a.dj.com/rss/RSSWorldNews.xml", homepage: "https://www.wsj.com", logo: "https://www.wsj.com/favicon.ico", enabled: true
    },
    {
        id: "cnbc_finance", name: "CNBC", country: "USA", region: "North America", language: "en",
        category: ["economy", "finance", "markets"], type: "economic_news", priority: 10, credibility: 9,
        rss: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664", homepage: "https://www.cnbc.com", logo: "https://www.cnbc.com/favicon.ico", enabled: true
    },

    // ==========================================
    // 15. TRUNG ĐÔNG
    // ==========================================
    {
        id: "aljazeera_me", name: "Al Jazeera", country: "Qatar", region: "Middle East", language: "en",
        category: ["general", "conflict"], type: "state_media", priority: 10, credibility: 9,
        rss: "https://www.aljazeera.com/xml/rss/all.xml", homepage: "https://www.aljazeera.com", logo: "https://www.aljazeera.com/favicon_aje.ico", enabled: true
    },
    {
        id: "timesofisrael_il", name: "Times of Israel", country: "Israel", region: "Middle East", language: "en",
        category: ["general", "politics"], type: "newspaper", priority: 8, credibility: 8,
        rss: "https://www.timesofisrael.com/feed/", homepage: "https://www.timesofisrael.com", logo: "https://www.timesofisrael.com/favicon.ico", enabled: true
    },

    // ==========================================
    // 18. TỔ CHỨC QUỐC TẾ
    // ==========================================
    {
        id: "un_news", name: "UN News", country: "Global", region: "Global", language: "en",
        category: ["diplomacy", "humanitarian"], type: "international_org", priority: 10, credibility: 10,
        rss: "https://news.un.org/feed/subscribe/en/news/all/rss.xml", homepage: "https://news.un.org", logo: "https://news.un.org/favicon.ico", enabled: true
    },
    {
        id: "who_news", name: "WHO", country: "Global", region: "Global", language: "en",
        category: ["health", "science"], type: "international_org", priority: 10, credibility: 10,
        rss: "https://www.who.int/rss-feeds/news-english.xml", homepage: "https://www.who.int", logo: "https://www.who.int/favicon.ico", enabled: true
    },

    // ==========================================
    // 20. CÔNG NGHỆ & KHOA HỌC
    // ==========================================
    {
        id: "techcrunch_tech", name: "TechCrunch", country: "USA", region: "Global", language: "en",
        category: ["technology", "startups"], type: "tech_news", priority: 9, credibility: 9,
        rss: "https://techcrunch.com/feed/", homepage: "https://techcrunch.com", logo: "https://techcrunch.com/favicon.ico", enabled: true
    },
    {
        id: "wired_tech", name: "Wired", country: "USA", region: "Global", language: "en",
        category: ["technology", "science"], type: "tech_news", priority: 8, credibility: 9,
        rss: "https://www.wired.com/feed/rss", homepage: "https://www.wired.com", logo: "https://www.wired.com/favicon.ico", enabled: true
    },
    {
        id: "mit_science", name: "MIT News", country: "USA", region: "Global", language: "en",
        category: ["science", "research"], type: "science_news", priority: 9, credibility: 10,
        rss: "https://news.mit.edu/rss/feed", homepage: "https://news.mit.edu", logo: "https://news.mit.edu/favicon.ico", enabled: true
    }
];

module.exports = { RSS_SOURCES };

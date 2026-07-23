// FILE: script_bot/config/rss_sources.js
const RSS_SOURCES = [
    // ==========================================
    // 1. GLOBAL (Ưu tiên cao nhất)
    // ==========================================
    {
        id: "npr_world", name: "NPR World", country: "USA", region: "Global", language: "en",
        category: ["world", "politics", "society"], type: "news_agency", priority: 10, credibility: 10,
        max_items: 20,
        rss: "https://feeds.npr.org/1004/rss.xml", homepage: "https://www.npr.org", logo: "https://www.npr.org/favicon.ico", enabled: true
    },
    {
        id: "yahoo_world", name: "Yahoo News", country: "USA", region: "Global", language: "en",
        category: ["general", "world"], type: "news_agency", priority: 10, credibility: 9,
        max_items: 20,
        rss: "https://news.yahoo.com/rss/world", homepage: "https://news.yahoo.com", logo: "https://news.yahoo.com/favicon.ico", enabled: true
    },
    {
        id: "bloomberg_world", name: "Bloomberg", country: "USA", region: "Global", language: "en",
        category: ["economy", "finance", "markets"], type: "economic_news", priority: 10, credibility: 10,
        max_items: 15,
        rss: "https://feeds.bloomberg.com/markets/news.rss", homepage: "https://www.bloomberg.com", logo: "https://www.bloomberg.com/favicon.ico", enabled: true
    },
    {
        id: "financial_times", name: "Financial Times", country: "UK", region: "Global", language: "en",
        category: ["economy", "finance", "business"], type: "economic_news", priority: 10, credibility: 10,
        max_items: 15,
        rss: "https://www.ft.com/rss/home", homepage: "https://www.ft.com", logo: "https://www.ft.com/favicon.ico", enabled: true
    },
    // ==========================================
    // 2. VIỆT NAM
    // ==========================================
    {
        id: "vnexpress_world", name: "VnExpress", country: "Vietnam", region: "Southeast Asia", language: "vi",
        category: ["general", "world"], type: "newspaper", priority: 10, credibility: 9,
        max_items: 12,
        rss: "https://vnexpress.net/rss/the-gioi.rss", homepage: "https://vnexpress.net", logo: "https://vnexpress.net/favicon.ico", enabled: true
    },
    {
        id: "tuoitre_world", name: "Tuổi Trẻ", country: "Vietnam", region: "Southeast Asia", language: "vi",
        category: ["general", "world"], type: "newspaper", priority: 10, credibility: 9,
        max_items: 12,
        rss: "https://tuoitre.vn/rss/the-gioi.rss", homepage: "https://tuoitre.vn", logo: "https://tuoitre.vn/favicon.ico", enabled: true
    },
    {
        id: "vtv_news", name: "VTV News", country: "Vietnam", region: "Southeast Asia", language: "vi",
        category: ["general", "politics"], type: "state_media", priority: 10, credibility: 9,
        max_items: 10,
        rss: "https://vtv.vn/rss/the-gioi.rss", homepage: "https://vtv.vn", logo: "https://vtv.vn/favicon.ico", enabled: true
    },
    {
        id: "vnexpress_biz", name: "VnExpress Kinh Doanh", country: "Vietnam", region: "Southeast Asia", language: "vi",
        category: ["economy", "finance", "markets"], type: "economic_news", priority: 10, credibility: 9,
        max_items: 12,
        rss: "https://vnexpress.net/rss/kinh-doanh.rss", homepage: "https://vnexpress.net", logo: "https://vnexpress.net/favicon.ico", enabled: true
    },
    {
        id: "cafef_home", name: "CafeF", country: "Vietnam", region: "Southeast Asia", language: "vi",
        category: ["economy", "finance", "markets"], type: "economic_news", priority: 9, credibility: 8,
        max_items: 10,
        rss: "https://cafef.vn/tin-moi-nhat.rss", homepage: "https://cafef.vn", logo: "https://cafef.vn/favicon.ico", enabled: true
    },
    {
        id: "dantri_world", name: "Dân Trí", country: "Vietnam", region: "Southeast Asia", language: "vi",
        category: ["general", "world"], type: "newspaper", priority: 9, credibility: 9,
        max_items: 10,
        rss: "https://dantri.com.vn/rss/the-gioi.rss", homepage: "https://dantri.com.vn", logo: "https://dantri.com.vn/favicon.ico", enabled: true
    },
    {
        id: "nhandan_news", name: "Báo Nhân Dân", country: "Vietnam", region: "Southeast Asia", language: "vi",
        category: ["politics", "policy", "general"], type: "state_media", priority: 10, credibility: 10,
        max_items: 8,
        rss: "https://nhandan.vn/rss/thoi-su-chinhtri.rss", homepage: "https://nhandan.vn", logo: "https://nhandan.vn/favicon.ico", enabled: true
    },
    // ==========================================
    // 3. ASEAN
    // ==========================================
    {
        id: "cna_asia", name: "CNA", country: "Singapore", region: "Southeast Asia", language: "en",
        category: ["general", "asia"], type: "news_agency", priority: 10, credibility: 9,
        max_items: 10,
        rss: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511", homepage: "https://www.channelnewsasia.com", logo: "https://www.channelnewsasia.com/favicon.ico", enabled: true
    },
    {
        id: "straitstimes_asia", name: "The Straits Times", country: "Singapore", region: "Southeast Asia", language: "en",
        category: ["general", "asia"], type: "newspaper", priority: 9, credibility: 9,
        max_items: 8,
        rss: "https://www.straitstimes.com/news/asia/rss.xml", homepage: "https://www.straitstimes.com", logo: "https://www.straitstimes.com/favicon.ico", enabled: true
    },
    {
        id: "malaymail", name: "Malay Mail", country: "Malaysia", region: "Southeast Asia", language: "en",
        category: ["general", "politics"], type: "newspaper", priority: 8, credibility: 8,
        max_items: 8,
        rss: "https://www.malaymail.com/feed/rss/", homepage: "https://www.malaymail.com", logo: "https://www.malaymail.com/favicon.ico", enabled: true
    },
    {
        id: "antara_id", name: "Antara News", country: "Indonesia", region: "Southeast Asia", language: "en",
        category: ["general", "politics"], type: "news_agency", priority: 9, credibility: 9,
        max_items: 8,
        rss: "https://en.antaranews.com/rss/news.xml", homepage: "https://en.antaranews.com", logo: "https://en.antaranews.com/favicon.ico", enabled: true
    },
    {
        id: "inquirer_ph", name: "Philippine Daily Inquirer", country: "Philippines", region: "Southeast Asia", language: "en",
        category: ["general", "politics"], type: "newspaper", priority: 9, credibility: 8,
        max_items: 8,
        rss: "https://www.inquirer.net/fullfeed", homepage: "https://www.inquirer.net", logo: "https://www.inquirer.net/favicon.ico", enabled: true
    },
    {
        id: "bangkokpost_th", name: "Bangkok Post", country: "Thailand", region: "Southeast Asia", language: "en",
        category: ["general", "economy"], type: "newspaper", priority: 9, credibility: 8,
        max_items: 8,
        rss: "https://www.bangkokpost.com/rss/data/topstories.xml", homepage: "https://www.bangkokpost.com", logo: "https://www.bangkokpost.com/favicon.ico", enabled: true
    },
    // ==========================================
    // 4. NHẬT BẢN & 5. HÀN QUỐC
    // ==========================================
    {
        id: "japantoday_jp", name: "Japan Today", country: "Japan", region: "East Asia", language: "en",
        category: ["general", "politics"], type: "newspaper", priority: 9, credibility: 8,
        max_items: 8,
        rss: "https://japantoday.com/feed", homepage: "https://japantoday.com", logo: "https://japantoday.com/favicon.ico", enabled: true
    },
    {
        id: "japantimes_jp", name: "The Japan Times", country: "Japan", region: "East Asia", language: "en",
        category: ["general", "politics", "economy"], type: "newspaper", priority: 10, credibility: 9,
        max_items: 10,
        rss: "https://www.japantimes.co.jp/feed/", homepage: "https://www.japantimes.co.jp", logo: "https://www.japantimes.co.jp/favicon.ico", enabled: true
    },
    {
        id: "nikkei_asia", name: "Nikkei Asia", country: "Japan", region: "East Asia", language: "en",
        category: ["economy", "finance", "business"], type: "economic_news", priority: 10, credibility: 10,
        max_items: 12,
        rss: "https://asia.nikkei.com/rss/feed/nar", homepage: "https://asia.nikkei.com", logo: "https://asia.nikkei.com/favicon.ico", enabled: true
    },
    {
        id: "yonhap_kr", name: "Yonhap", country: "South Korea", region: "East Asia", language: "en",
        category: ["general", "politics"], type: "news_agency", priority: 9, credibility: 9,
        max_items: 10,
        rss: "https://en.yna.co.kr/RSS/news.xml", homepage: "https://en.yna.co.kr", logo: "https://en.yna.co.kr/favicon.ico", enabled: true
    },
    {
        id: "joongang_kr", name: "Korea JoongAng Daily", country: "South Korea", region: "East Asia", language: "en",
        category: ["general", "politics"], type: "newspaper", priority: 9, credibility: 9,
        max_items: 8,
        rss: "https://koreajoongangdaily.joins.com/rss", homepage: "https://koreajoongangdaily.joins.com", logo: "https://koreajoongangdaily.joins.com/favicon.ico", enabled: true
    },
    // ==========================================
    // 6. TRUNG QUỐC, 7. HỒNG KÔNG & 8. ĐÀI LOAN
    // ==========================================
    {
        id: "xinhua_world", name: "Xinhua", country: "China", region: "East Asia", language: "en",
        category: ["general", "politics"], type: "state_media", priority: 9, credibility: 7,
        max_items: 10,
        rss: "http://www.xinhuanet.com/english/rss/worldrss.xml", homepage: "http://www.xinhuanet.com/english/", logo: "http://www.xinhuanet.com/favicon.ico", enabled: true
    },
    {
        id: "cnbc_asia", name: "CNBC Asia", country: "Hong Kong", region: "East Asia", language: "en",
        category: ["economy", "finance", "business"], type: "economic_news", priority: 10, credibility: 9,
        max_items: 12,
        rss: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19832390", homepage: "https://www.cnbc.com/asia-world/", logo: "https://www.cnbc.com/favicon.ico", enabled: true
    },
    {
        id: "rti_tw", name: "RTI", country: "Taiwan", region: "East Asia", language: "en",
        category: ["general", "politics"], type: "state_media", priority: 9, credibility: 9,
        max_items: 8,
        rss: "https://en.rti.org.tw/rss", homepage: "https://en.rti.org.tw", logo: "https://en.rti.org.tw/favicon.ico", enabled: true
    },
    {
        id: "scmp_hk", name: "South China Morning Post", country: "Hong Kong", region: "East Asia", language: "en",
        category: ["economy", "politics", "asia"], type: "newspaper", priority: 10, credibility: 9,
        max_items: 12,
        rss: "https://www.scmp.com/rss/91/feed", homepage: "https://www.scmp.com", logo: "https://www.scmp.com/favicon.ico", enabled: true
    },
    {
        id: "hongkongfp", name: "Hong Kong Free Press", country: "Hong Kong", region: "East Asia", language: "en",
        category: ["politics", "society"], type: "newspaper", priority: 8, credibility: 8,
        max_items: 8,
        rss: "https://hongkongfp.com/feed/", homepage: "https://hongkongfp.com", logo: "https://hongkongfp.com/favicon.ico", enabled: true
    },
    {
        id: "taiwannews_tw", name: "Taiwan News", country: "Taiwan", region: "East Asia", language: "en",
        category: ["general", "politics"], type: "newspaper", priority: 9, credibility: 8,
        max_items: 8,
        rss: "https://www.taiwannews.com.tw/rss/news.xml", homepage: "https://www.taiwannews.com.tw", logo: "https://www.taiwannews.com.tw/favicon.ico", enabled: true
    },
    {
        id: "taipeitimes_tw", name: "Taipei Times", country: "Taiwan", region: "East Asia", language: "en",
        category: ["general", "politics"], type: "newspaper", priority: 8, credibility: 8,
        max_items: 8,
        rss: "https://www.taipeitimes.com/xml/index.rss", homepage: "https://www.taipeitimes.com", logo: "https://www.taipeitimes.com/favicon.ico", enabled: true
    },
    // ==========================================
    // 9. ẤN ĐỘ
    // ==========================================
    {
        id: "thehindu_in", name: "The Hindu", country: "India", region: "South Asia", language: "en",
        category: ["general", "politics"], type: "newspaper", priority: 9, credibility: 9,
        max_items: 10,
        rss: "https://www.thehindu.com/news/national/feeder/default.rss", homepage: "https://www.thehindu.com", logo: "https://www.thehindu.com/favicon.ico", enabled: true
    },
    {
        id: "timesofindia", name: "Times of India", country: "India", region: "South Asia", language: "en",
        category: ["general", "politics"], type: "newspaper", priority: 9, credibility: 8,
        max_items: 10,
        rss: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", homepage: "https://timesofindia.indiatimes.com", logo: "https://timesofindia.indiatimes.com/favicon.ico", enabled: true
    },
    {
        id: "economictimes_in", name: "Economic Times", country: "India", region: "South Asia", language: "en",
        category: ["economy", "finance", "business"], type: "economic_news", priority: 10, credibility: 9,
        max_items: 12,
        rss: "https://economictimes.indiatimes.com/rssfeedstopstories.cms", homepage: "https://economictimes.indiatimes.com", logo: "https://economictimes.indiatimes.com/favicon.ico", enabled: true
    },
    // ==========================================
    // 10. CHÂU ÂU
    // ==========================================
    {
        id: "bbc_world", name: "BBC News", country: "UK", region: "Europe", language: "en",
        category: ["general", "world"], type: "state_media", priority: 10, credibility: 10,
        max_items: 15,
        rss: "http://feeds.bbci.co.uk/news/world/rss.xml", homepage: "https://www.bbc.com/news", logo: "https://www.bbc.co.uk/favicon.ico", enabled: true
    },
    {
        id: "theguardian_world", name: "The Guardian", country: "UK", region: "Europe", language: "en",
        category: ["general", "politics"], type: "newspaper", priority: 9, credibility: 9,
        max_items: 12,
        rss: "https://www.theguardian.com/world/rss", homepage: "https://www.theguardian.com", logo: "https://www.theguardian.com/favicon.ico", enabled: true
    },
    {
        id: "dw_germany", name: "DW", country: "Germany", region: "Europe", language: "en",
        category: ["general", "politics"], type: "state_media", priority: 9, credibility: 9,
        max_items: 10,
        rss: "https://rss.dw.com/rdf/rss-en-world", homepage: "https://www.dw.com", logo: "https://www.dw.com/favicon.ico", enabled: true
    },
    {
        id: "france24_fr", name: "France24", country: "France", region: "Europe", language: "en",
        category: ["general", "world"], type: "state_media", priority: 9, credibility: 9,
        max_items: 10,
        rss: "https://www.france24.com/en/rss", homepage: "https://www.france24.com", logo: "https://www.france24.com/favicon.ico", enabled: true
    },
    {
        id: "politico_eu", name: "Politico Europe", country: "Belgium", region: "Europe", language: "en",
        category: ["politics", "policy"], type: "newspaper", priority: 10, credibility: 9,
        max_items: 12,
        rss: "https://www.politico.eu/feed/", homepage: "https://www.politico.eu", logo: "https://www.politico.eu/favicon.ico", enabled: true
    },
    {
        id: "euronews", name: "Euronews", country: "France", region: "Europe", language: "en",
        category: ["general", "politics", "europe"], type: "news_agency", priority: 8, credibility: 9,
        max_items: 8,
        rss: "https://www.euronews.com/rss", homepage: "https://www.euronews.com", logo: "https://www.euronews.com/favicon.ico", enabled: true
    },
    // ==========================================
    // 11. NGA & 12. UKRAINE
    // ==========================================
    {
        id: "tass_ru", name: "TASS", country: "Russia", region: "Eastern Europe", language: "en",
        category: ["politics", "world"], type: "state_media", priority: 9, credibility: 6,
        max_items: 10,
        rss: "https://tass.com/rss/v2.xml", homepage: "https://tass.com", logo: "https://tass.com/favicon.ico", enabled: true
    },
    {
        id: "themoscowtimes", name: "The Moscow Times", country: "Netherlands", region: "Eastern Europe", language: "en",
        category: ["politics", "conflict"], type: "newspaper", priority: 8, credibility: 8,
        max_items: 8,
        rss: "https://www.themoscowtimes.com/rss/news", homepage: "https://www.themoscowtimes.com", logo: "https://www.themoscowtimes.com/favicon.ico", enabled: true
    },
    {
        id: "kyivindependent_ua", name: "Kyiv Independent", country: "Ukraine", region: "Eastern Europe", language: "en",
        category: ["politics", "conflict"], type: "newspaper", priority: 9, credibility: 8,
        max_items: 10,
        rss: "https://kyivindependent.com/feed/", homepage: "https://kyivindependent.com", logo: "https://kyivindependent.com/favicon.ico", enabled: true
    },
    {
        id: "interfax_ua", name: "Interfax-Ukraine", country: "Ukraine", region: "Eastern Europe", language: "en",
        category: ["general", "conflict"], type: "news_agency", priority: 8, credibility: 8,
        max_items: 8,
        rss: "https://en.interfax.com.ua/news/last.rss", homepage: "https://en.interfax.com.ua", logo: "https://en.interfax.com.ua/favicon.ico", enabled: true
    },
    // ==========================================
    // 13. HOA KỲ & 14. CANADA
    // ==========================================
    {
        id: "nyt_world", name: "New York Times", country: "USA", region: "North America", language: "en",
        category: ["general", "world"], type: "newspaper", priority: 10, credibility: 9,
        max_items: 15,
        rss: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", homepage: "https://www.nytimes.com", logo: "https://www.nytimes.com/favicon.ico", enabled: true
    },
    {
        id: "wsj_world", name: "Wall Street Journal", country: "USA", region: "North America", language: "en",
        category: ["economy", "politics"], type: "newspaper", priority: 10, credibility: 9,
        max_items: 15,
        rss: "https://feeds.a.dj.com/rss/RSSWorldNews.xml", homepage: "https://www.wsj.com", logo: "https://www.wsj.com/favicon.ico", enabled: true
    },
    {
        id: "cnn_top", name: "CNN", country: "USA", region: "North America", language: "en",
        category: ["general", "politics"], type: "newspaper", priority: 10, credibility: 8,
        max_items: 15,
        rss: "http://rss.cnn.com/rss/edition.rss", homepage: "https://edition.cnn.com", logo: "https://edition.cnn.com/favicon.ico", enabled: true
    },
    {
        id: "foxnews_world", name: "Fox News", country: "USA", region: "North America", language: "en",
        category: ["general", "politics"], type: "newspaper", priority: 8, credibility: 7,
        max_items: 10,
        rss: "http://feeds.foxnews.com/foxnews/world", homepage: "https://www.foxnews.com", logo: "https://www.foxnews.com/favicon.ico", enabled: true
    },
    {
        id: "cbc_ca", name: "CBC News", country: "Canada", region: "North America", language: "en",
        category: ["general", "politics"], type: "state_media", priority: 9, credibility: 9,
        max_items: 10,
        rss: "https://www.cbc.ca/cmlink/rss-topstories", homepage: "https://www.cbc.ca", logo: "https://www.cbc.ca/favicon.ico", enabled: true
    },
    // ==========================================
    // 15. NAM MỸ & 16. CHÂU PHI
    // ==========================================
    {
        id: "batimes_ar", name: "Buenos Aires Times", country: "Argentina", region: "South America", language: "en",
        category: ["general", "politics", "economy"], type: "newspaper", priority: 7, credibility: 8,
        max_items: 6,
        rss: "https://www.batimes.com.ar/feed", homepage: "https://www.batimes.com.ar", logo: "https://www.batimes.com.ar/favicon.ico", enabled: true
    },
    {
        id: "mercopress", name: "MercoPress", country: "Uruguay", region: "South America", language: "en",
        category: ["economy", "politics"], type: "news_agency", priority: 8, credibility: 8,
        max_items: 6,
        rss: "https://en.mercopress.com/rss/", homepage: "https://en.mercopress.com", logo: "https://en.mercopress.com/favicon.ico", enabled: true
    },
    {
        id: "allafrica", name: "AllAfrica", country: "Global", region: "Africa", language: "en",
        category: ["general", "politics", "society"], type: "news_agency", priority: 8, credibility: 8,
        max_items: 8,
        rss: "https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf", homepage: "https://allafrica.com", logo: "https://allafrica.com/favicon.ico", enabled: true
    },
    {
        id: "sabc_za", name: "SABC News", country: "South Africa", region: "Africa", language: "en",
        category: ["general", "politics"], type: "state_media", priority: 8, credibility: 8,
        max_items: 6,
        rss: "https://www.sabcnews.com/sabcnews/feed/", homepage: "https://www.sabcnews.com", logo: "https://www.sabcnews.com/favicon.ico", enabled: true
    },
    // ==========================================
    // 17. TRUNG ĐÔNG
    // ==========================================
    {
        id: "aljazeera_me", name: "Al Jazeera", country: "Qatar", region: "Middle East", language: "en",
        category: ["general", "conflict"], type: "state_media", priority: 10, credibility: 9,
        max_items: 12,
        rss: "https://www.aljazeera.com/xml/rss/all.xml", homepage: "https://www.aljazeera.com", logo: "https://www.aljazeera.com/favicon_aje.ico", enabled: true
    },
    {
        id: "jpost_il", name: "Jerusalem Post", country: "Israel", region: "Middle East", language: "en",
        category: ["general", "politics"], type: "newspaper", priority: 9, credibility: 8,
        max_items: 10,
        rss: "https://www.jpost.com/rss/rssfeedsfrontpage", homepage: "https://www.jpost.com", logo: "https://www.jpost.com/favicon.ico", enabled: true
    },
    {
        id: "khaleejtimes", name: "Khaleej Times", country: "UAE", region: "Middle East", language: "en",
        category: ["general", "economy"], type: "newspaper", priority: 8, credibility: 8,
        max_items: 8,
        rss: "https://www.khaleejtimes.com/feed", homepage: "https://www.khaleejtimes.com", logo: "https://www.khaleejtimes.com/favicon.ico", enabled: true
    },
    {
        id: "middleeasteye", name: "Middle East Eye", country: "UK", region: "Middle East", language: "en",
        category: ["politics", "conflict"], type: "newspaper", priority: 8, credibility: 8,
        max_items: 8,
        rss: "https://www.middleeasteye.net/rss", homepage: "https://www.middleeasteye.net", logo: "https://www.middleeasteye.net/favicon.ico", enabled: true
    },
    // ==========================================
    // 18. TỔ CHỨC QUỐC TẾ
    // ==========================================
    {
        id: "hrw_news", name: "Human Rights Watch", country: "Global", region: "Global", language: "en",
        category: ["diplomacy", "humanitarian"], type: "international_org", priority: 10, credibility: 9,
        max_items: 8,
        rss: "https://www.hrw.org/rss/news", homepage: "https://www.hrw.org", logo: "https://www.hrw.org/favicon.ico", enabled: true
    },
    {
        id: "who_news", name: "WHO", country: "Global", region: "Global", language: "en",
        category: ["health", "science"], type: "international_org", priority: 10, credibility: 10,
        max_items: 5,
        rss: "https://www.who.int/rss-feeds/news-english.xml", homepage: "https://www.who.int", logo: "https://www.who.int/favicon.ico", enabled: true
    },
    {
        id: "adb_news", name: "Asian Development Bank", country: "Global", region: "Global", language: "en",
        category: ["economy", "finance"], type: "international_org", priority: 10, credibility: 10,
        max_items: 5,
        rss: "https://www.adb.org/rss/news", homepage: "https://www.adb.org", logo: "https://www.adb.org/favicon.ico", enabled: true
    },
    // ==========================================
    // 19. KINH TẾ - TÀI CHÍNH
    // ==========================================
    {
        id: "cnbc_finance", name: "CNBC", country: "USA", region: "Global", language: "en",
        category: ["economy", "finance", "markets"], type: "economic_news", priority: 10, credibility: 9,
        max_items: 15,
        rss: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664", homepage: "https://www.cnbc.com", logo: "https://www.cnbc.com/favicon.ico", enabled: true
    },
    {
        id: "marketwatch", name: "MarketWatch", country: "USA", region: "Global", language: "en",
        category: ["finance", "markets"], type: "economic_news", priority: 9, credibility: 9,
        max_items: 12,
        rss: "http://feeds.marketwatch.com/marketwatch/topstories", homepage: "https://www.marketwatch.com", logo: "https://www.marketwatch.com/favicon.ico", enabled: true
    },
    {
        id: "investing_com", name: "Investing.com", country: "Global", region: "Global", language: "en",
        category: ["finance", "markets", "commodities"], type: "economic_news", priority: 8, credibility: 8,
        max_items: 10,
        rss: "https://www.investing.com/rss/news.rss", homepage: "https://www.investing.com", logo: "https://www.investing.com/favicon.ico", enabled: true
    },
    // ==========================================
    // 20. KHOA HỌC & 28. MÔI TRƯỜNG
    // ==========================================
    {
        id: "nature_journal", name: "Nature", country: "UK", region: "Global", language: "en",
        category: ["science", "research"], type: "science_news", priority: 10, credibility: 10,
        max_items: 5,
        rss: "https://www.nature.com/nature.rss", homepage: "https://www.nature.com", logo: "https://www.nature.com/favicon.ico", enabled: true
    },
    {
        id: "science_daily", name: "ScienceDaily", country: "USA", region: "Global", language: "en",
        category: ["science", "research"], type: "science_news", priority: 9, credibility: 9,
        max_items: 8,
        rss: "https://www.sciencedaily.com/rss/all.xml", homepage: "https://www.sciencedaily.com", logo: "https://www.sciencedaily.com/favicon.ico", enabled: true
    },
    {
        id: "mit_science", name: "MIT News", country: "USA", region: "Global", language: "en",
        category: ["science", "technology"], type: "science_news", priority: 10, credibility: 10,
        max_items: 5,
        rss: "https://news.mit.edu/rss/feed", homepage: "https://news.mit.edu", logo: "https://news.mit.edu/favicon.ico", enabled: true
    },
    {
        id: "mongabay_env", name: "Mongabay", country: "USA", region: "Global", language: "en",
        category: ["environment", "climate"], type: "science_news", priority: 9, credibility: 9,
        max_items: 6,
        rss: "https://news.mongabay.com/feed/", homepage: "https://news.mongabay.com", logo: "https://news.mongabay.com/favicon.ico", enabled: true
    },
    // ==========================================
    // 21. CÔNG NGHỆ, 22. AI, 23. AN NINH MẠNG, 24. STARTUP
    // ==========================================
    {
        id: "techcrunch", name: "TechCrunch", country: "USA", region: "Global", language: "en",
        category: ["technology", "startups"], type: "tech_news", priority: 10, credibility: 9,
        max_items: 12,
        rss: "https://techcrunch.com/feed/", homepage: "https://techcrunch.com", logo: "https://techcrunch.com/favicon.ico", enabled: true
    },
    {
        id: "wired_tech", name: "Wired", country: "USA", region: "Global", language: "en",
        category: ["technology", "culture"], type: "tech_news", priority: 10, credibility: 9,
        max_items: 10,
        rss: "https://www.wired.com/feed/rss", homepage: "https://www.wired.com", logo: "https://www.wired.com/favicon.ico", enabled: true
    },
    {
        id: "theverge", name: "The Verge", country: "USA", region: "Global", language: "en",
        category: ["technology", "consumer"], type: "tech_news", priority: 9, credibility: 9,
        max_items: 10,
        rss: "https://www.theverge.com/rss/index.xml", homepage: "https://www.theverge.com", logo: "https://www.theverge.com/favicon.ico", enabled: true
    },
    {
        id: "arstechnica", name: "Ars Technica", country: "USA", region: "Global", language: "en",
        category: ["technology", "science"], type: "tech_news", priority: 9, credibility: 10,
        max_items: 8,
        rss: "http://feeds.arstechnica.com/arstechnica/index", homepage: "https://arstechnica.com", logo: "https://arstechnica.com/favicon.ico", enabled: true
    },
    {
        id: "openai_blog", name: "OpenAI News", country: "USA", region: "Global", language: "en",
        category: ["ai", "technology"], type: "tech_news", priority: 10, credibility: 10,
        max_items: 5,
        rss: "https://openai.com/blog/rss.xml", homepage: "https://openai.com", logo: "https://openai.com/favicon.ico", enabled: true
    },
    {
        id: "thehackernews", name: "The Hacker News", country: "Global", region: "Global", language: "en",
        category: ["cybersecurity", "technology"], type: "tech_news", priority: 9, credibility: 9,
        max_items: 8,
        rss: "https://feeds.feedburner.com/TheHackersNews", homepage: "https://thehackernews.com", logo: "https://thehackernews.com/favicon.ico", enabled: true
    },
    {
        id: "bleepingcomputer", name: "BleepingComputer", country: "USA", region: "Global", language: "en",
        category: ["cybersecurity", "technology"], type: "tech_news", priority: 9, credibility: 9,
        max_items: 8,
        rss: "https://www.bleepingcomputer.com/feed/", homepage: "https://www.bleepingcomputer.com", logo: "https://www.bleepingcomputer.com/favicon.ico", enabled: true
    },
    // ==========================================
    // 25. VĂN HÓA, 26. GIẢI TRÍ, 27. THỂ THAO, 29. Y TẾ
    // ==========================================
    {
        id: "smithsonian", name: "Smithsonian Magazine", country: "USA", region: "Global", language: "en",
        category: ["culture", "history"], type: "magazine", priority: 8, credibility: 10,
        max_items: 5,
        rss: "https://www.smithsonianmag.com/rss/latest_articles/", homepage: "https://www.smithsonianmag.com", logo: "https://www.smithsonianmag.com/favicon.ico", enabled: true
    },
    {
        id: "variety", name: "Variety", country: "USA", region: "Global", language: "en",
        category: ["entertainment", "culture"], type: "magazine", priority: 8, credibility: 9,
        max_items: 5,
        rss: "https://variety.com/feed/", homepage: "https://variety.com", logo: "https://variety.com/favicon.ico", enabled: true
    },
    {
        id: "yahoo_sports", name: "Yahoo Sports", country: "USA", region: "Global", language: "en",
        category: ["sports"], type: "news_agency", priority: 10, credibility: 9,
        max_items: 8,
        rss: "https://sports.yahoo.com/rss/", homepage: "https://sports.yahoo.com", logo: "https://sports.yahoo.com/favicon.ico", enabled: true
    },
    {
        id: "statnews_health", name: "STAT News", country: "USA", region: "Global", language: "en",
        category: ["health", "science"], type: "science_news", priority: 10, credibility: 10,
        max_items: 5,
        rss: "https://www.statnews.com/feed/", homepage: "https://www.statnews.com", logo: "https://www.statnews.com/favicon.ico", enabled: true
    }
];

module.exports = { RSS_SOURCES };

// FILE: script_bot/config/social_sources.js

// ==========================================
// 1. REDDIT (Cào qua đuôi .rss, hoàn toàn miễn phí)
// ==========================================
const REDDIT_SUBREDDITS_TO_WATCH = [
    // Tin tức quốc tế
    { name: 'worldnews', label: 'World News' },
    { name: 'news', label: 'News' },
    { name: 'anime_titties', label: 'Geopolitics (Serious)' }, 
    { name: 'geopolitics', label: 'Geopolitics' },
    { name: 'inthenews', label: 'In The News' },

    // Kinh tế - Tài chính
    { name: 'economics', label: 'Economics' },
    { name: 'Economics', label: 'Economics Academic' },
    { name: 'stocks', label: 'Stocks' },
    { name: 'investing', label: 'Investing' },
    { name: 'SecurityAnalysis', label: 'Security Analysis' },
    { name: 'finance', label: 'Finance' },

    // AI - Công nghệ
    { name: 'artificial', label: 'Artificial Intelligence' },
    { name: 'MachineLearning', label: 'Machine Learning' },
    { name: 'OpenAI', label: 'OpenAI' },
    { name: 'singularity', label: 'Singularity' },
    { name: 'technology', label: 'Technology' },
    { name: 'programming', label: 'Programming' },

    // Khoa học
    { name: 'science', label: 'Science' },
    { name: 'space', label: 'Space' },
    { name: 'Physics', label: 'Physics' },
    { name: 'biology', label: 'Biology' },

    // Crypto
    { name: 'CryptoCurrency', label: 'CryptoCurrency' },
    { name: 'Bitcoin', label: 'Bitcoin' },
    { name: 'ethereum', label: 'Ethereum' }
];

// ==========================================
// 2. YOUTUBE (Nên dùng RSS XML của kênh để tiết kiệm Quota API)
// ==========================================
const YOUTUBE_CHANNELS_TO_WATCH = [
    // Báo chí quốc tế
    { channelId: 'Reuters', label: 'Reuters' },
    { channelId: 'Bloomberg', label: 'Bloomberg Television' },
    { channelId: 'AssociatedPress', label: 'Associated Press' },
    { channelId: 'CNBC', label: 'CNBC' },
    { channelId: 'BBCNews', label: 'BBC News' },
    { channelId: 'DWNews', label: 'DW News' },
    { channelId: 'SkyNews', label: 'Sky News' },
    { channelId: 'France24_en', label: 'France 24 English' },
    { channelId: 'NHKWORLDJAPAN', label: 'NHK WORLD-JAPAN' },
    { channelId: 'aljazeeraenglish', label: 'Al Jazeera English' },

    // Kinh tế
    { channelId: 'FinancialTimes', label: 'Financial Times' },
    { channelId: 'TheEconomist', label: 'The Economist' },
    { channelId: 'YahooFinance', label: 'Yahoo Finance' },
    { channelId: 'WSJ', label: 'Wall Street Journal' },

    // AI & Công nghệ
    { channelId: 'OpenAI', label: 'OpenAI' },
    { channelId: 'GoogleDeepMind', label: 'Google DeepMind' },
    { channelId: 'Anthropic', label: 'Anthropic' },
    { channelId: 'NVIDIA', label: 'NVIDIA' },
    { channelId: 'MicrosoftDeveloper', label: 'Microsoft Developer' },
    { channelId: 'HuggingFace', label: 'Hugging Face' },

    // Khoa học
    { channelId: 'NASA', label: 'NASA' },
    { channelId: 'ESA', label: 'ESA' },
    { channelId: 'CERN', label: 'CERN' },
    { channelId: 'nature video', label: 'Nature' },
    { channelId: 'NewScientist', label: 'New Scientist' },

    // Chính phủ
    { channelId: 'WhiteHouse', label: 'The White House' },
    { channelId: '10DowningStreet', label: 'UK Prime Minister' },
    { channelId: 'EuropeanCommission', label: 'European Commission' },
    { channelId: 'NATO', label: 'NATO' },
    { channelId: 'unitednations', label: 'United Nations' }
];

// ==========================================
// 3. TELEGRAM (Cào HTML Preview miễn phí)
// ==========================================
const TELEGRAM_CHANNELS_TO_WATCH = [
    // Chiến sự - OSINT
    { username: 'osintdefender', label: 'OSINTdefender' },
    { username: 'noel_reports', label: 'NOELREPORTS' },
    { username: 'warmonitors', label: 'War Monitor' },
    { username: 'intelslava', label: 'Intel Slava Z' },
    { username: 'UkraineNow', label: 'Ukraine NOW' },
    { username: 'DefenceHQ', label: 'Defence Intelligence UK' },

    // Kinh tế & Crypto
    { username: 'bloomberg', label: 'Bloomberg Alerts' },
    { username: 'financialtimes', label: 'Financial Times' },
    { username: 'coindesk', label: 'CoinDesk' },
    { username: 'cointelegraph', label: 'Cointelegraph' },

    // AI & Khoa học
    { username: 'openai_news', label: 'OpenAI News' },
    { username: 'huggingface', label: 'Hugging Face' },
    { username: 'langchain', label: 'LangChain' },
    { username: 'aibreakfast', label: 'AI Breakfast' },
    { username: 'nasa', label: 'NASA' },
    { username: 'esa', label: 'ESA' },
    { username: 'who', label: 'WHO' },
    { username: 'unnews', label: 'UN News' },

    // Cảnh báo thiên tai
    { username: 'usgs', label: 'USGS' },
    { username: 'noaa', label: 'NOAA' },
    { username: 'emsc', label: 'EMSC' },
    { username: 'gdacs', label: 'GDACS' }
];

// ==========================================
// 4. X / TWITTER (Cào qua Apify - Cẩn thận ngân sách)
// ==========================================
const X_ACCOUNTS_TO_WATCH = [
    // NHÓM CÁ NHÂN QUYỀN LỰC (Phát ngôn gốc - Ưu tiên ngân sách vào đây)
    { handle: 'elonmusk', label: 'Elon Musk' },
    { handle: 'sama', label: 'Sam Altman' },
    { handle: 'satyanadella', label: 'Satya Nadella' },
    { handle: 'demishassabis', label: 'Demis Hassabis' },
    { handle: 'sundarpichai', label: 'Sundar Pichai' },
    // Jensen Huang và Mark Zuckerberg ít tweet/dùng nền tảng khác nên có thể theo dõi tài khoản công ty.

    /* 
     * [CẢNH BÁO TÀI CHÍNH APIFY] 
     * Nếu bật hết danh sách dưới đây, bạn sẽ bị tính phí cho mỗi lần cào.
     * Hãy chỉ "uncomment" (mở dấu //) những nguồn thực sự muốn cào tức thời.
     */
    
    // { handle: 'OpenAI', label: 'OpenAI' },
    // { handle: 'AnthropicAI', label: 'Anthropic' },
    // { handle: 'GoogleDeepMind', label: 'Google DeepMind' },
    // { handle: 'nvidia', label: 'NVIDIA' },
    // { handle: 'UN', label: 'United Nations' },
    // { handle: 'WHO', label: 'WHO' },
    // { handle: 'IMFNews', label: 'IMF' },
    // { handle: 'WorldBank', label: 'World Bank' },
    // { handle: 'NATO', label: 'NATO' },
    // { handle: 'Reuters', label: 'Reuters' },
    // { handle: 'AP', label: 'AP News' },
    // { handle: 'TheEconomist', label: 'The Economist' }
];

module.exports = {
    REDDIT_SUBREDDITS_TO_WATCH,
    YOUTUBE_CHANNELS_TO_WATCH,
    TELEGRAM_CHANNELS_TO_WATCH,
    X_ACCOUNTS_TO_WATCH
};

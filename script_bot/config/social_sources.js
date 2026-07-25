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
// Bắt buộc sử dụng Channel ID chuẩn bắt đầu bằng "UC..."
// ==========================================
const YOUTUBE_CHANNELS_TO_WATCH = [
    // Báo chí quốc tế
    { channelId: 'UChqUTb7kYRX8-EiaN3XFrSQ', label: 'Reuters' },
    { channelId: 'UCIALMKvObZNtJ6AmdCLP7Lg', label: 'Bloomberg Television' },
    { channelId: 'UC52X5wxOL_s5yw0dQk7NtgA', label: 'Associated Press' },
    { channelId: 'UCvJJ_dzjViJCoLf5uKUTwoA', label: 'CNBC' },
    { channelId: 'UC16niRr50-MSBwiO3YDb3RA', label: 'BBC News' },
    { channelId: 'UCknLrEdhRCp1aegoMqRaCZg', label: 'DW News' },
    { channelId: 'UCzG5BnqHO8oNlrPDW9CYJog', label: 'Sky News' },  
    { channelId: 'UCQfwfsi5VrQ8yKZ-UWmAEFg', label: 'France 24 English' },
    { channelId: 'UCSPEjw8F2nQDtmUKPFNF7_A', label: 'NHK WORLD-JAPAN' },
    { channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg', label: 'Al Jazeera English' },

    // Kinh tế
    { channelId: 'UCoUxsWakJucWg46KW5RsvPw', label: 'Financial Times' },
    { channelId: 'UC0p5jTq6Xx_DosDFxVXnWaQ', label: 'The Economist' },
    { channelId: 'UCEAZeUIeJs0IjQiqTCdVSIg', label: 'Yahoo Finance' },
    { channelId: 'UCK7tptUDHh-RYDsdxO1-5QQ', label: 'Wall Street Journal' },

    // AI & Công nghệ
    { channelId: 'UCXZCJLdBC09xxGZ6gcdrc6A', label: 'OpenAI' },
    { channelId: 'UCP7jMXSY2xbc3KCAE0MHQ-A', label: 'Google DeepMind' },
    { channelId: 'UCrDwWp7EBBv4NwvScIpBDOA', label: 'Anthropic' },
    { channelId: 'UCHuiy8bXnmK5nisYHUd1J5g', label: 'NVIDIA' },
    { channelId: 'UCsMica-v34Irf9KVTh6xx-g', label: 'Microsoft Developer' },
    { channelId: 'UCHlNU7kIZhRgSbhHvFoy72w', label: 'Hugging Face' },

    // Khoa học
    { channelId: 'UCLA_DiR1FfKNvjuUpBHmylQ', label: 'NASA' },
    { channelId: 'UCIBaDdAbGlFDeS33shmlD0A', label: 'ESA' },
    { channelId: 'UCrHXK2A9JtiexqwHuWGeSMg', label: 'CERN' },
    { channelId: 'UC7c8mE90qCtu11z47U0KErg', label: 'Nature' },
    { channelId: 'UCt5OA3LingpZBeEyPYmputQ', label: 'New Scientist' },

    // Chính phủ
    { channelId: 'UCYxRlFDqcWM4y7FfpiAN3KQ', label: 'The White House' },
    { channelId: 'UCDNfD5f4rM-jKxeb0q1Wp5Q', label: 'UK Prime Minister' },
    { channelId: 'UCMPaviJxybo1RTdzvYcU91A', label: 'European Commission' },
    { channelId: 'UCHlEaKbepQ_S9iIoZPKVQew', label: 'NATO' },
    { channelId: 'UC5O114-PQNYkurlTg6hekZw', label: 'United Nations' }
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
];

module.exports = {
    REDDIT_SUBREDDITS_TO_WATCH,
    YOUTUBE_CHANNELS_TO_WATCH,
    TELEGRAM_CHANNELS_TO_WATCH,
    X_ACCOUNTS_TO_WATCH
};

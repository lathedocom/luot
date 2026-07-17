// Danh sách các nguồn cấp dữ liệu RSS.
// Thiết kế chuẩn Schema giúp module Crawler có đủ metadata ngay từ đầu.

module.exports = [
    {
        url: 'https://vnexpress.net/rss/tin-moi-nhat.rss',
        source_name: 'VNExpress',
        source_logo: 'https://s1.vnecdn.net/vnexpress/restruct/i/v895/v2_2019/pc/graphics/favicon.ico',
        country: 'VN',
        language: 'vi',
        trust_score: 90
    },
    {
        url: 'https://vneconomy.vn/rss/kinh-te-vi-mo.rss',
        source_name: 'VnEconomy',
        source_logo: 'https://vneconomy.vn/favicon.ico',
        country: 'VN',
        language: 'vi',
        trust_score: 85
    },
    {
        url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664',
        source_name: 'CNBC',
        source_logo: 'https://www.cnbc.com/favicon.ico',
        country: 'US',
        language: 'en',
        trust_score: 95
    },
    {
        url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
        source_name: 'BBC News',
        source_logo: 'https://www.bbc.co.uk/favicon.ico',
        country: 'UK',
        language: 'en',
        trust_score: 95
    },
    {
        url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
        source_name: 'The Wall Street Journal',
        source_logo: 'https://www.wsj.com/favicon.ico',
        country: 'US',
        language: 'en',
        trust_score: 95
    }
];

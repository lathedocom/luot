// Khai báo các khu vực (Region) và quy tắc Map nguồn mặc định

module.exports = {
    REGIONS: [
        { id: 'vietnam', name: 'Việt Nam', keywords: ['việt nam', 'hà nội', 'tphcm', 'chính phủ vn', 'thủ tướng', 'vnindex'] },
        { id: 'usa', name: 'Mỹ', keywords: ['mỹ', 'hoa kỳ', 'washington', 'biden', 'fed', 'wall street', 'new york', 'trump'] },
        { id: 'china', name: 'Trung Quốc', keywords: ['trung quốc', 'bắc kinh', 'tập cận bình', 'đài loan', 'thượng hải'] },
        { id: 'eu', name: 'Châu Âu', keywords: ['châu âu', 'eu', 'liên minh châu âu', 'anh', 'pháp', 'đức', 'ecb'] },
        { id: 'asean', name: 'Đông Nam Á', keywords: ['asean', 'đông nam á', 'thái lan', 'indonesia', 'malaysia', 'singapore'] },
        { id: 'global', name: 'Toàn cầu', keywords: ['toàn cầu', 'thế giới', 'wto', 'who', 'world bank'] }
    ],
    
    // Gán nhãn cứng khu vực dựa trên tên nguồn báo (Rule-based siêu tốc)
    SOURCE_DEFAULT_REGION: {
        'VNExpress': 'vietnam',
        'VnEconomy': 'vietnam',
        'Reuters': 'global',
        'CNBC': 'usa',
        'BBC News': 'global',
        'The Wall Street Journal': 'usa',
        'The Economist': 'global',
        'Al Jazeera': 'global'
    }
};

// FILE: script_bot/config/regions.js

module.exports = {
    REGIONS: [
        { 
            id: 'vietnam', 
            name: 'Việt Nam', 
            keywords: ['việt nam', 'hà nội', 'tphcm', 'chính phủ', 'thủ tướng chính phủ', 'vnindex', 'nhà nước'] 
        },
        { 
            id: 'usa', 
            name: 'Mỹ', 
            keywords: ['mỹ', 'hoa kỳ', 'washington', 'biden', 'fed', 'wall street', 'new york', 'trump', 'lầu năm góc'] 
        },
        { 
            id: 'china', 
            name: 'Trung Quốc', 
            keywords: ['trung quốc', 'bắc kinh', 'tập cận bình', 'đài loan', 'thượng hải', 'hong kong'] 
        },
        { 
            id: 'eu', 
            name: 'Châu Âu', 
            keywords: ['châu âu', 'eu', 'liên minh châu âu', 'anh', 'pháp', 'đức', 'ecb', 'ukraine', 'nga', 'moscow', 'kyiv', 'putin', 'zelensky'] 
        },
        { 
            id: 'asean', 
            name: 'Đông Nam Á', 
            keywords: ['asean', 'đông nam á', 'thái lan', 'indonesia', 'malaysia', 'singapore', 'philippines', 'kuala lumpur'] 
        },
        { 
            id: 'asia', 
            name: 'Châu Á', 
            keywords: ['châu á', 'nhật bản', 'hàn quốc', 'ấn độ', 'tokyo', 'seoul', 'new delhi', 'takaichi', 'yoon suk yeol', 'modi'] 
        },
        { 
            id: 'middle_east', 
            name: 'Trung Đông', 
            keywords: ['trung đông', 'israel', 'iran', 'palestine', 'gaza', 'hamas', 'syria', 'lebanon', 'hezbollah'] 
        },
        { 
            id: 'global', 
            name: 'Toàn cầu', 
            keywords: ['toàn cầu', 'thế giới', 'wto', 'who', 'world bank', 'imf', 'liên hợp quốc', 'nato'] 
        }
    ],
    
    // Gán nhãn cứng khu vực dựa trên tên nguồn báo
    // CHỈ áp dụng cho các báo có tính chuyên biệt vùng miền rõ rệt.
    SOURCE_DEFAULT_REGION: {
        'Reuters': 'global',
        'CNBC': 'usa',
        'BBC News': 'global',
        'The Wall Street Journal': 'usa',
        'The Economist': 'global',
        'Al Jazeera': 'middle_east'
        // Đã xóa VNExpress, VnEconomy... khỏi đây để buộc hệ thống phải đọc hiểu từ khóa thay vì gán mù quáng.
    }
};

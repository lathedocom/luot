// FILE: script_bot/config/regions.js
module.exports = {
    REGIONS: [
        { id: 'vietnam', name: 'Việt Nam', keywords: ['việt nam', 'hà nội', 'tphcm', 'chính phủ'] },
        { id: 'usa', name: 'Mỹ', keywords: ['mỹ', 'hoa kỳ', 'washington', 'biden', 'trump', 'fed'] },
        { id: 'canada', name: 'Canada', keywords: ['canada', 'ottawa', 'trudeau'] },
        { id: 'china', name: 'Trung Quốc', keywords: ['trung quốc', 'bắc kinh', 'tập cận bình', 'đài loan'] },
        { id: 'eu', name: 'Châu Âu', keywords: ['châu âu', 'eu', 'anh', 'pháp', 'đức', 'ecb'] },
        { id: 'russia_ukraine', name: 'Nga & Ukraine', keywords: ['nga', 'ukraine', 'moscow', 'kyiv', 'putin', 'zelensky'] },
        { id: 'asean', name: 'Đông Nam Á', keywords: ['asean', 'đông nam á', 'thái lan', 'indonesia', 'malaysia', 'singapore', 'philippines', 'campuchia', 'lào', 'myanmar'] },
        { id: 'asia', name: 'Châu Á', keywords: ['châu á', 'nhật bản', 'hàn quốc', 'ấn độ', 'tokyo', 'seoul', 'new delhi'] },
        { id: 'middle_east', name: 'Trung Đông', keywords: ['trung đông', 'israel', 'iran', 'palestine', 'gaza', 'syria', 'lebanon'] },
        
        // [MỚI] Các châu lục và khu vực được bổ sung
        { id: 'oceania', name: 'Châu Úc', keywords: ['úc', 'australia', 'new zealand', 'sydney', 'melbourne'] },
        { id: 'latin_america', name: 'Mỹ Latinh', keywords: ['châu mỹ', 'mỹ latinh', 'brazil', 'argentina', 'mexico', 'venezuela', 'colombia'] },
        { id: 'africa', name: 'Châu Phi', keywords: ['châu phi', 'nam phi', 'ghana', 'nigeria', 'ai cập', 'kenya'] },
        
        { id: 'global', name: 'Toàn cầu', keywords: ['toàn cầu', 'thế giới', 'wto', 'who', 'world bank', 'imf', 'lHQ', 'nato'] }
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

// FILE: script_bot/config/categories.js
// Khai báo 10 Trụ cột chuyên mục (Category) và bộ từ khóa (Keywords) Song ngữ
module.exports = {
    CATEGORIES: [
        { 
            id: 'politics', 
            name: 'Chính trị & Pháp luật', 
            keywords: [
                // Tiếng Việt
                'chính trị', 'chính phủ', 'quốc hội', 'tổng thống', 'bầu cử', 'thủ tướng', 
                'pháp luật', 'tòa án', 'luật pháp', 'chính sách', 'nghị định', 'biểu tình',
                'đảo chính', 'luận tội', 'bạo loạn', 'hiến pháp', 'tối cao pháp viện', 'hạ viện', 'thượng viện',
                // Tiếng Anh
                'politics', 'government', 'parliament', 'president', 'election', 'prime minister', 
                'law', 'court', 'policy', 'legislation', 'protest', 'senate', 'congress', 'supreme court', 'coup'
            ] 
        },
        { 
            id: 'economy', 
            name: 'Kinh tế & Thương mại', 
            keywords: [
                // Tiếng Việt
                'kinh tế', 'gdp', 'lạm phát', 'lãi suất', 'ngân hàng nhà nước', 'vĩ mô', 
                'suy thoái', 'thương mại', 'xuất khẩu', 'nhập khẩu', 'chuỗi cung ứng', 'thuế quan',
                'thất nghiệp', 'tiêu dùng', 'bán lẻ', 'sản xuất', 'pmi', 'cpi', 'fdi', 'oda', 'thuế',
                // Tiếng Anh
                'economy', 'inflation', 'interest rate', 'recession', 'macroeconomic', 'central bank', 
                'gdp', 'trade', 'export', 'import', 'supply chain', 'tariff', 'unemployment', 'retail', 'manufacturing'
            ] 
        },
        { 
            id: 'finance', 
            name: 'Tài chính & Đầu tư', 
            keywords: [
                // Tiếng Việt
                'tài chính', 'chứng khoán', 'cổ phiếu', 'trái phiếu', 'vnindex', 'fed', 'tỷ giá', 
                'tiền điện tử', 'bitcoin', 'đầu tư', 'quỹ etf', 'thanh khoản', 'cổ tức',
                'đồng yên', 'jpy', 'usd', 'đô la', 'euro', 'eur', 'bảng anh', 'gbp', 'nhân dân tệ', 'cny',
                'vàng', 'sjc', 'lợi suất', 'phố wall',
                // Tiếng Anh
                'finance', 'stock', 'shares', 'bonds', 'wall street', 'currency', 'exchange rate', 
                'fed', 'crypto', 'bitcoin', 'investment', 'liquidity', 'dividend', 'yield', 'forex', 'gold'
            ] 
        },
        { 
            id: 'military', 
            name: 'Quân sự & Quốc phòng', 
            keywords: [
                // Tiếng Việt
                'quân sự', 'quân đội', 'vũ khí', 'xung đột', 'tên lửa', 'quốc phòng', 'chiến sự', 
                'chiến tranh', 'khủng bố', 'nato', 'hạt nhân', 'tình báo', 'không kích', 'thiết giáp',
                'hạm đội', 'tập trận', 'uav', 'drone', 'pháo binh', 'chiến hạm',
                // Tiếng Anh
                'military', 'army', 'weapon', 'conflict', 'missile', 'defense', 'war', 
                'terrorism', 'nato', 'nuclear', 'pentagon', 'intelligence', 'airstrike', 'drone', 'fleet', 'troops'
            ] 
        },
        { 
            id: 'diplomacy', 
            name: 'Quan hệ quốc tế', 
            keywords: [
                // Tiếng Việt
                'ngoại giao', 'hiệp định', 'trừng phạt', 'liên minh', 'đàm phán', 'lãnh thổ', 
                'đại sứ', 'lhq', 'liên hợp quốc', 'hội nghị thượng đỉnh', 'địa chính trị', 'lãnh hải', 'đại sứ quán',
                'cấm vận', 'song phương', 'đa phương',
                // Tiếng Anh
                'diplomacy', 'treaty', 'sanctions', 'alliance', 'negotiation', 'territory', 
                'ambassador', 'un', 'united nations', 'summit', 'geopolitical', 'embargo', 'bilateral'
            ] 
        },
        { 
            id: 'tech', 
            name: 'Công nghệ & Khoa học', 
            keywords: [
                // Tiếng Việt
                'công nghệ', 'ai', 'chip', 'bán dẫn', 'phần mềm', 'an ninh mạng', 'trí tuệ nhân tạo', 
                'vệ tinh', 'khoa học', 'phát minh', 'đột phá', 'không gian', 'lượng tử', 'hacker',
                'thuật toán', 'mô hình ngôn ngữ', 'llm', 'dữ liệu lớn',
                // Tiếng Anh
                'technology', 'artificial intelligence', 'semiconductor', 'software', 'cybersecurity', 
                'satellite', 'science', 'breakthrough', 'innovation', 'space', 'quantum', 'hacker', 'llm', 'big data'
            ] 
        },
        { 
            id: 'health', 
            name: 'Y tế & Sức khỏe', 
            keywords: [
                // Tiếng Việt
                'y tế', 'dịch bệnh', 'vắc-xin', 'virus', 'bệnh viện', 'thuốc', 'tổ chức y tế', 
                'đột biến', 'sức khỏe cộng đồng', 'lây nhiễm', 'who', 'fda', 'đại dịch', 'ung thư',
                // Tiếng Anh
                'health', 'disease', 'vaccine', 'virus', 'hospital', 'medicine', 'who', 'fda',
                'mutation', 'public health', 'infection', 'pandemic', 'cancer', 'outbreak'
            ] 
        },
        { 
            id: 'environment', 
            name: 'Môi trường & Thiên tai', 
            keywords: [
                // Tiếng Việt
                'môi trường', 'thiên tai', 'động đất', 'bão', 'sóng thần', 'khí hậu', 'ô nhiễm', 
                'lũ lụt', 'hạn hán', 'phát thải', 'lũ quét', 'sạt lở', 'el nino', 'la nina',
                'cop28', 'cop29', 'biến đổi khí hậu', 'carbon',
                // Tiếng Anh
                'environment', 'disaster', 'earthquake', 'storm', 'tsunami', 'climate', 'pollution', 
                'flood', 'drought', 'emission', 'hurricane', 'typhoon', 'wildfire', 'carbon'
            ] 
        },
        { 
            id: 'energy', 
            name: 'Năng lượng', 
            keywords: [
                // Tiếng Việt
                'năng lượng', 'giá dầu', 'khí đốt', 'điện', 'năng lượng tái tạo', 'opec', 
                'xăng dầu', 'nhiên liệu', 'pin', 'năng lượng mặt trời', 'năng lượng gió', 'thủy điện',
                'nhiệt điện', 'khí hóa lỏng', 'lng',
                // Tiếng Anh
                'energy', 'oil price', 'gas', 'electricity', 'renewable', 'opec', 
                'fuel', 'battery', 'solar', 'wind power', 'lng', 'crude oil'
            ] 
        },
        { 
            id: 'business', 
            name: 'Doanh nghiệp', 
            keywords: [
                // Tiếng Việt
                'doanh nghiệp', 'phá sản', 'sáp nhập', 'm&a', 'ipo', 'startup', 'tập đoàn', 
                'ceo', 'lợi nhuận', 'sa thải', 'chuỗi cung ứng', 'doanh thu', 'quý', 'báo cáo tài chính',
                'cổ đông', 'đình công',
                // Tiếng Anh
                'business', 'bankruptcy', 'merger', 'm&a', 'ipo', 'startup', 'corporation', 
                'ceo', 'profit', 'layoff', 'supply chain', 'revenue', 'earnings', 'shareholder', 'strike'
            ] 
        }
    ]
};

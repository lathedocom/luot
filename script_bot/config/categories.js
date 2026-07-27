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
                // Tiếng Anh
                'politics', 'government', 'parliament', 'president', 'election', 'prime minister', 
                'law', 'court', 'policy', 'legislation', 'protest', 'senate'
            ] 
        },
        { 
            id: 'economy', 
            name: 'Kinh tế & Thương mại', 
            keywords: [
                // Tiếng Việt
                'kinh tế', 'gdp', 'lạm phát', 'lãi suất', 'ngân hàng nhà nước', 'vĩ mô', 
                'suy thoái', 'thương mại', 'xuất khẩu', 'nhập khẩu', 'chuỗi cung ứng', 'thuế quan',
                // Tiếng Anh
                'economy', 'inflation', 'interest rate', 'recession', 'macroeconomic', 'central bank', 
                'gdp', 'trade', 'export', 'import', 'supply chain', 'tariff'
            ] 
        },
        { 
            id: 'finance', 
            name: 'Tài chính & Đầu tư', 
            keywords: [
                // Tiếng Việt
                'tài chính', 'chứng khoán', 'cổ phiếu', 'trái phiếu', 'vnindex', 'fed', 'tỷ giá', 
                'tiền điện tử', 'bitcoin', 'đầu tư', 'fdi', 'quỹ etf', 'thanh khoản',
                // Tiếng Anh
                'finance', 'stock', 'shares', 'bonds', 'wall street', 'currency', 'exchange rate', 
                'fed', 'crypto', 'bitcoin', 'investment', 'fdi', 'liquidity'
            ] 
        },
        { 
            id: 'military', 
            name: 'Quân sự & Quốc phòng', 
            keywords: [
                // Tiếng Việt
                'quân sự', 'quân đội', 'vũ khí', 'xung đột', 'tên lửa', 'quốc phòng', 'chiến sự', 
                'chiến tranh', 'khủng bố', 'nato', 'hạt nhân', 'tình báo',
                // Tiếng Anh
                'military', 'army', 'weapon', 'conflict', 'missile', 'defense', 'war', 
                'terrorism', 'nato', 'nuclear', 'pentagon', 'intelligence'
            ] 
        },
        { 
            id: 'diplomacy', 
            name: 'Quan hệ quốc tế', 
            keywords: [
                // Tiếng Việt
                'ngoại giao', 'hiệp định', 'trừng phạt', 'liên minh', 'đàm phán', 'lãnh thổ', 
                'đại sứ', 'lHQ', 'hội nghị thượng đỉnh', 'địa chính trị',
                // Tiếng Anh
                'diplomacy', 'treaty', 'sanctions', 'alliance', 'negotiation', 'territory', 
                'ambassador', 'UN', 'summit', 'geopolitical'
            ] 
        },
        { 
            id: 'tech', 
            name: 'Công nghệ & Khoa học', 
            keywords: [
                // Tiếng Việt
                'công nghệ', 'ai', 'chip', 'bán dẫn', 'phần mềm', 'an ninh mạng', 'trí tuệ nhân tạo', 
                'vệ tinh', 'khoa học', 'phát minh', 'đột phá', 'không gian',
                // Tiếng Anh
                'technology', 'artificial intelligence', 'semiconductor', 'software', 'cybersecurity', 
                'satellite', 'science', 'breakthrough', 'innovation', 'space'
            ] 
        },
        { 
            id: 'health', 
            name: 'Y tế & Sức khỏe', 
            keywords: [
                // Tiếng Việt
                'y tế', 'dịch bệnh', 'vắc-xin', 'virus', 'bệnh viện', 'thuốc', 'tổ chức y tế', 
                'đột biến', 'sức khỏe cộng đồng', 'lây nhiễm',
                // Tiếng Anh
                'health', 'disease', 'vaccine', 'virus', 'hospital', 'medicine', 'WHO', 
                'mutation', 'public health', 'infection'
            ] 
        },
        { 
            id: 'environment', 
            name: 'Môi trường & Thiên tai', 
            keywords: [
                // Tiếng Việt
                'môi trường', 'thiên tai', 'động đất', 'bão', 'sóng thần', 'khí hậu', 'ô nhiễm', 
                'lũ lụt', 'hạn hán', 'phát thải',
                // Tiếng Anh
                'environment', 'disaster', 'earthquake', 'storm', 'tsunami', 'climate', 'pollution', 
                'flood', 'drought', 'emission'
            ] 
        },
        { 
            id: 'energy', 
            name: 'Năng lượng', 
            keywords: [
                // Tiếng Việt
                'năng lượng', 'giá dầu', 'khí đốt', 'điện', 'năng lượng tái tạo', 'opec', 
                'xăng dầu', 'nhiên liệu', 'pin', 'năng lượng mặt trời',
                // Tiếng Anh
                'energy', 'oil price', 'gas', 'electricity', 'renewable', 'opec', 
                'fuel', 'battery', 'solar'
            ] 
        },
        { 
            id: 'business', 
            name: 'Doanh nghiệp', 
            keywords: [
                // Tiếng Việt
                'doanh nghiệp', 'phá sản', 'sáp nhập', 'm&a', 'ipo', 'startup', 'tập đoàn', 
                'ceo', 'lợi nhuận', 'sa thải', 'chuỗi cung ứng',
                // Tiếng Anh
                'business', 'bankruptcy', 'merger', 'm&a', 'ipo', 'startup', 'corporation', 
                'ceo', 'profit', 'layoff', 'supply chain'
            ] 
        }
    ]
};

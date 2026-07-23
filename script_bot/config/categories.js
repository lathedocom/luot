// Khai báo các chuyên mục (Category) và bộ từ khóa (Keywords) Song ngữ mở rộng
module.exports = {
    CATEGORIES: [
        { 
            id: 'money', 
            name: 'Kiếm tiền', 
            keywords: [
                // Tiếng Việt
                'thu nhập', 'lương', 'kiếm tiền online', 'freelance', 'tiết kiệm', 'kiếm tiền', 
                'làm giàu', 'chi tiêu', 'ngân sách', 'hưu trí', 'tài sản', 'thu nhập thụ động',
                // Tiếng Anh
                'income', 'salary', 'earn money', 'savings', 'wage', 'wealth', 
                'budget', 'retirement', 'personal finance', 'side hustle', 'passive income', 'cash'
            ] 
        },
        { 
            id: 'economy', 
            name: 'Kinh tế', 
            keywords: [
                // Tiếng Việt
                'kinh tế', 'gdp', 'lạm phát', 'lãi suất', 'ngân hàng nhà nước', 'vĩ mô', 
                'suy thoái', 'tăng trưởng', 'thất nghiệp', 'cpi', 'pmi', 'chính sách tiền tệ',
                // Tiếng Anh
                'economy', 'inflation', 'interest rate', 'recession', 'macroeconomic', 'central bank', 
                'gdp', 'growth', 'unemployment', 'cpi', 'pmi', 'monetary policy', 'economic'
            ] 
        },
        { 
            id: 'finance', 
            name: 'Tài chính', 
            keywords: [
                // Tiếng Việt
                'tài chính', 'chứng khoán', 'cổ phiếu', 'trái phiếu', 'vnindex', 'fed', 'tỷ giá', 'tiền tệ', 
                'quỹ etf', 'phái sinh', 'tiền ảo', 'bitcoin', 'crypto', 'ngân hàng', 'thanh khoản',
                // Tiếng Anh
                'finance', 'stock', 'shares', 'bonds', 'wall street', 'currency', 'exchange rate', 
                'fed', 'etf', 'derivatives', 'crypto', 'bitcoin', 'banking', 'equities', 'forex', 'liquidity'
            ] 
        },
        { 
            id: 'trade', 
            name: 'Thương mại', 
            keywords: [
                // Tiếng Việt
                'thương mại', 'xuất khẩu', 'nhập khẩu', 'thuế quan', 'fta', 'chuỗi cung ứng', 'bán lẻ', 
                'logistics', 'vận tải', 'hải quan', 'wto', 'thương mại điện tử', 'e-commerce',
                // Tiếng Anh
                'trade', 'export', 'import', 'tariff', 'supply chain', 'retail', 'commerce', 
                'logistics', 'shipping', 'customs', 'wto', 'fta', 'e-commerce'
            ] 
        },
        { 
            id: 'investment', 
            name: 'Đầu tư', 
            keywords: [
                // Tiếng Việt
                'đầu tư', 'quỹ đầu tư', 'm&a', 'gọi vốn', 'ipo', 'startup', 'fdi', 
                'bất động sản', 'cổ đông', 'khởi nghiệp', 'sáp nhập', 'lợi nhuận', 'cổ tức',
                // Tiếng Anh
                'investment', 'fund', 'venture capital', 'funding', 'investors', 'acquisition', 
                'ipo', 'startup', 'fdi', 'real estate', 'shareholders', 'merger', 'profit', 'roi', 'dividend'
            ] 
        },
        { 
            id: 'tech', 
            name: 'Công nghệ', 
            keywords: [
                // Tiếng Việt
                'công nghệ', 'ai', 'chip', 'bán dẫn', 'phần mềm', 'apple', 'nvidia', 'trí tuệ nhân tạo', 
                'an ninh mạng', 'điện toán đám mây', 'ứng dụng', 'viễn thông', 'robot', 'smartphone',
                // Tiếng Anh
                'technology', 'artificial intelligence', 'semiconductor', 'software', 'silicon', 
                'cyber', 'cloud', 'app', 'telecom', 'robot', 'smartphone', 'big tech', 'openai', 'microsoft'
            ] 
        },
        { 
            id: 'science', 
            name: 'Khoa học', 
            keywords: [
                // Tiếng Việt
                'khoa học', 'nghiên cứu', 'phát minh', 'vắc-xin', 'vật lý', 'pin thể rắn', 'sinh học', 
                'hóa học', 'y tế', 'không gian', 'nasa', 'thiên văn', 'đột phá',
                // Tiếng Anh
                'science', 'research', 'discovery', 'vaccine', 'physics', 'biology', 'breakthrough', 
                'chemistry', 'medical', 'space', 'nasa', 'astronomy', 'healthcare'
            ] 
        },
        { 
            id: 'politics', 
            name: 'Chính trị', 
            keywords: [
                // Tiếng Việt
                'chính trị', 'chính phủ', 'quốc hội', 'tổng thống', 'bầu cử', 'thủ tướng', 'ngoại giao', 
                'đảng', 'biểu tình', 'nhân quyền', 'bộ trưởng', 'địa chính trị',
                // Tiếng Anh
                'politics', 'government', 'parliament', 'president', 'election', 'prime minister', 'diplomacy', 
                'protest', 'party', 'human rights', 'minister', 'senate', 'congress', 'geopolitical'
            ] 
        },
        { 
            id: 'policy', 
            name: 'Chính sách', 
            keywords: [
                // Tiếng Việt
                'chính sách', 'nghị định', 'thông tư', 'quy định mới', 'chính sách thuế', 'quy hoạch', 
                'luật pháp sửa đổi', 'dự thảo', 'cấp phép', 'cải cách',
                // Tiếng Anh
                'policy', 'regulation', 'decree', 'legislation', 'lawmakers', 'guidelines', 
                'compliance', 'draft', 'licensing', 'regulatory', 'reform'
            ] 
        },
        { 
            id: 'law', 
            name: 'Pháp luật', 
            keywords: [
                // Tiếng Việt
                'pháp luật', 'luật', 'tòa án', 'kiện tụng', 'vi phạm', 'xử phạt', 'điều tra', 'công an', 
                'tội phạm', 'cảnh sát', 'án mạng', 'lừa đảo', 'ma túy', 'xét xử',
                // Tiếng Anh
                'law', 'court', 'lawsuit', 'investigation', 'police', 'illegal', 'fines', 'guilty', 
                'crime', 'murder', 'scam', 'drugs', 'justice', 'fbi', 'arrest', 'prison', 'trial'
            ] 
        },
        { 
            id: 'military', 
            name: 'Quân sự', 
            keywords: [
                // Tiếng Việt
                'quân sự', 'quân đội', 'vũ khí', 'xung đột', 'tên lửa', 'quốc phòng', 'chiến sự', 
                'chiến tranh', 'hải quân', 'không quân', 'khủng bố', 'nato', 'lính đánh thuê', 'hạt nhân',
                // Tiếng Anh
                'military', 'army', 'weapon', 'conflict', 'missile', 'defense', 'war', 'troops', 'nuclear', 
                'navy', 'air force', 'terrorism', 'nato', 'pentagon', 'weapons', 'mercenary'
            ] 
        }
    ]
};

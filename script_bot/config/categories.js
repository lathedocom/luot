// Khai báo các chuyên mục (Category) và bộ từ khóa (Keywords) 
// để Rule Engine có thể tự động gán nhãn Multi-label (Không tốn quota AI).

module.exports = {
    CATEGORIES: [
        { 
            id: 'economy', 
            name: 'Kinh tế', 
            keywords: ['kinh tế', 'lạm phát', 'gdp', 'ngân hàng', 'lãi suất', 'xuất nhập khẩu', 'doanh nghiệp'] 
        },
        { 
            id: 'finance', 
            name: 'Tài chính', 
            keywords: ['chứng khoán', 'cổ phiếu', 'trái phiếu', 'vnindex', 'fed', 'tỷ giá', 'vàng', 'crypto'] 
        },
        { 
            id: 'tech', 
            name: 'Công nghệ', 
            keywords: ['công nghệ', 'apple', 'google', 'microsoft', 'ai', 'trí tuệ nhân tạo', 'phần mềm', 'chip', 'bán dẫn'] 
        },
        { 
            id: 'politics', 
            name: 'Chính trị & Luật', 
            keywords: ['chính phủ', 'quốc hội', 'luật', 'chính sách', 'tổng thống', 'thủ tướng', 'bầu cử', 'eu'] 
        },
        { 
            id: 'world', 
            name: 'Thế giới', 
            keywords: ['quốc tế', 'thế giới', 'liên hợp quốc', 'toàn cầu', 'xung đột', 'chiến sự'] 
        }
    ]
};

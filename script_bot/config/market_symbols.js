module.exports = {
    // Danh sách các chỉ số thị trường được thiết kế tối ưu cho người Việt Nam
    SYMBOLS: [
        // --- TỶ GIÁ & TIỀN TỆ (Quy đổi trực tiếp ra VND) ---
        { id: 'USD_VND', name: 'USD / VND', type: 'currency', threshold: 0.2, api_source: 'yahoo', api_symbol: 'VND=X', keywords: ['usd', 'tỷ giá', 'ngân hàng nhà nước', 'đô la'], category: 'Tỷ giá & Tiền tệ', unit: 'VND' },
        { id: 'EUR_VND', name: 'EUR / VND', type: 'currency', threshold: 0.5, api_source: 'yahoo', api_symbol: 'EURVND=X', keywords: ['eur', 'euro', 'tỷ giá'], category: 'Tỷ giá & Tiền tệ', unit: 'VND' },
        { id: 'JPY_VND', name: 'JPY / VND (Yên Nhật)', type: 'currency', threshold: 0.5, api_source: 'yahoo', api_symbol: 'JPYVND=X', keywords: ['jpy', 'yên nhật', 'tỷ giá'], category: 'Tỷ giá & Tiền tệ', unit: 'VND' },
        { id: 'CNY_VND', name: 'CNY / VND (Nhân Dân Tệ)', type: 'currency', threshold: 0.5, api_source: 'yahoo', api_symbol: 'CNYVND=X', keywords: ['cny', 'nhân dân tệ', 'tỷ giá'], category: 'Tỷ giá & Tiền tệ', unit: 'VND' },
        { id: 'KRW_VND', name: 'KRW / VND (Won Hàn)', type: 'currency', threshold: 0.5, api_source: 'yahoo', api_symbol: 'KRWVND=X', keywords: ['krw', 'won', 'hàn quốc', 'tỷ giá'], category: 'Tỷ giá & Tiền tệ', unit: 'VND' },
        { id: 'DXY', name: 'Sức mạnh Đô la (DXY)', type: 'currency', threshold: 0.5, api_source: 'yahoo', api_symbol: 'DX-Y.NYB', keywords: ['dxy', 'sức mạnh usd', 'fed'], category: 'Tỷ giá & Tiền tệ', unit: 'Điểm' },

        // --- CHỨNG KHOÁN (Trong nước & Quốc tế trọng điểm) ---
        { id: 'VNINDEX', name: 'VN-Index', type: 'stock', threshold: 1.0, api_source: 'yahoo', api_symbol: '^VNINDEX', keywords: ['vnindex', 'chứng khoán việt nam', 'hose', 'cổ phiếu'], category: 'Thị trường Chứng khoán', unit: 'Điểm' },
        { id: 'HNX', name: 'HNX-Index', type: 'stock', threshold: 1.5, api_source: 'yahoo', api_symbol: '^HASTC', keywords: ['hnx', 'sàn hà nội'], category: 'Thị trường Chứng khoán', unit: 'Điểm' },
        { id: 'SP500', name: 'S&P 500 (Mỹ)', type: 'stock', threshold: 1.0, api_source: 'yahoo', api_symbol: '^GSPC', keywords: ['s&p 500', 'chứng khoán mỹ', 'wall street'], category: 'Thị trường Chứng khoán', unit: 'Điểm' },

        // --- KIM LOẠI & VÀNG ---
        { id: 'GOLD_W', name: 'Vàng Thế giới (XAU)', type: 'metal', threshold: 1.0, api_source: 'yahoo', api_symbol: 'GC=F', keywords: ['vàng thế giới', 'xau', 'fed'], category: 'Kim loại & Vàng', unit: 'USD/oz' },
        { id: 'GOLD_SJC', name: 'Vàng miếng SJC', type: 'metal', threshold: 0.5, api_source: 'local', api_symbol: 'SJC', base_price: 85.00, keywords: ['vàng sjc', 'vàng miếng', 'giá vàng trong nước'], category: 'Kim loại & Vàng', unit: 'Triệu/lượng' },
        { id: 'GOLD_RING', name: 'Vàng nhẫn 9999', type: 'metal', threshold: 0.5, api_source: 'local', api_symbol: 'RING', base_price: 83.50, keywords: ['vàng nhẫn', 'vàng 9999', 'nhẫn trơn'], category: 'Kim loại & Vàng', unit: 'Triệu/lượng' },

        // --- NĂNG LƯỢNG & NHIÊN LIỆU SINH HOẠT ---
        { id: 'BRENT', name: 'Dầu thô Brent', type: 'energy', threshold: 2.0, api_source: 'yahoo', api_symbol: 'BZ=F', keywords: ['dầu brent', 'giá dầu', 'opec'], category: 'Nhiên liệu & Năng lượng', unit: 'USD/thùng' },
        { id: 'XANG_E10_RON95', name: 'Xăng E10 RON 95-III', type: 'energy', threshold: 2.0, api_source: 'local', api_symbol: 'E10RON95', base_price: 23500, keywords: ['giá xăng', 'e10 ron 95', 'điều hành giá xăng', 'liên bộ'], category: 'Nhiên liệu & Năng lượng', unit: 'VNĐ/lít' },
        { id: 'XANG_E5_RON92', name: 'Xăng E5 RON 92', type: 'energy', threshold: 2.0, api_source: 'local', api_symbol: 'E5RON92', base_price: 22500, keywords: ['xăng e5', 'ron 92', 'giá nhiên liệu'], category: 'Nhiên liệu & Năng lượng', unit: 'VNĐ/lít' },
        { id: 'DAU_DO', name: 'Dầu Diesel 0.05S', type: 'energy', threshold: 2.0, api_source: 'local', api_symbol: 'DIESEL', base_price: 20500, keywords: ['dầu do', 'dầu diesel', 'nhiên liệu'], category: 'Nhiên liệu & Năng lượng', unit: 'VNĐ/lít' },

        // --- NÔNG SẢN & VẬT LIỆU XÂY DỰNG ---
        { id: 'COFFEE', name: 'Cà phê', type: 'agriculture', threshold: 2.0, api_source: 'yahoo', api_symbol: 'KC=F', keywords: ['cà phê', 'robusta', 'arabica', 'xuất khẩu nông sản'], category: 'Nông sản & Vật liệu', unit: 'USc/lb' },
        { id: 'RICE', name: 'Gạo thô', type: 'agriculture', threshold: 2.0, api_source: 'yahoo', api_symbol: 'ZR=F', keywords: ['gạo', 'xuất khẩu gạo', 'lúa gạo'], category: 'Nông sản & Vật liệu', unit: 'USD/cwt' },
        { id: 'RUBBER_VN', name: 'Cao su tự nhiên', type: 'agriculture', threshold: 2.0, api_source: 'local', api_symbol: 'RUBBER', base_price: 35.5, keywords: ['cao su', 'mủ cao su', 'xuất khẩu cao su'], category: 'Nông sản & Vật liệu', unit: 'Triệu/tấn' },
        { id: 'STEEL_VN', name: 'Thép xây dựng CB300', type: 'metal', threshold: 2.0, api_source: 'local', api_symbol: 'STEEL', base_price: 14.2, keywords: ['giá thép', 'vật liệu xây dựng', 'hòa phát', 'ngành thép'], category: 'Nông sản & Vật liệu', unit: 'Triệu/tấn' },

        // --- TIỀN ĐIỆN TỬ ---
        { id: 'BTC', name: 'Bitcoin (BTC)', type: 'crypto', threshold: 0.0, api_source: 'coingecko', api_symbol: 'bitcoin', keywords: ['bitcoin', 'btc', 'tiền ảo', 'tiền mã hóa'], category: 'Tiền điện tử', unit: 'USD' }
    ]
};

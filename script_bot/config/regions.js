// FILE: script_bot/config/regions.js
module.exports = {
    REGIONS: [
        // --- VIỆT NAM VÀ ĐÔNG NAM Á ---
        { id: 'VN', name: 'Việt Nam', keywords: ['việt nam', 'hà nội', 'tphcm', 'chính phủ', 'miền trung', 'đồng bằng sông cửu long', 'vietnam', 'vietjet', 'vingroup', 'vinfast', 'hòa phát', 'fpt', 'vinamilk', 
                'vietcombank', 'bidv', 'hdbank', 'vietinbank', 'masan', 'thế giới di động', 'mwg', 'nhnn'] },
        { id: 'PH', name: 'Philippines', keywords: ['philippines', 'manila', 'luzon', 'visayas', 'mindanao', 'phi-líp-pin'] },
        { id: 'TH', name: 'Thái Lan', keywords: ['thái lan', 'bangkok', 'thailand'] },
        { id: 'ID', name: 'Indonesia', keywords: ['indonesia', 'jakarta', 'bali', 'sumatra', 'java'] },
        { id: 'MY', name: 'Malaysia', keywords: ['malaysia', 'kuala lumpur'] },
        { id: 'MM', name: 'Myanmar', keywords: ['myanmar', 'yangon', 'naypyidaw', 'miến điện'] },
        { id: 'LA', name: 'Lào', keywords: ['lào', 'viêng chăn', 'vientiane', 'laos'] },
        { id: 'KH', name: 'Campuchia', keywords: ['campuchia', 'phnom penh', 'cambodia'] },
        { id: 'SG', name: 'Singapore', keywords: ['singapore'] },
        { id: 'BN', name: 'Brunei', keywords: ['brunei'] },
        { id: 'TL', name: 'Đông Timor', keywords: ['timor-leste', 'east timor', 'dili'] },


        // --- CƯỜNG QUỐC (LUÔN PHÂN TÍCH) ---
        { id: 'US', name: 'Mỹ', keywords: ['mỹ', 'hoa kỳ', 'washington', 'usa', 'biden', 'trump'] },
        { id: 'CN', name: 'Trung Quốc', keywords: ['trung quốc', 'bắc kinh', 'china'] },
        { id: 'RU', name: 'Nga', keywords: ['nga', 'moscow', 'putin', 'russia'] },
        { id: 'JP', name: 'Nhật Bản', keywords: ['nhật bản', 'tokyo', 'japan'] },
        { id: 'GB', name: 'Anh', keywords: ['anh', 'vương quốc anh', 'uk', 'london'] },
        { id: 'EU', name: 'Châu Âu', keywords: ['châu âu', 'eu', 'pháp', 'đức', 'italy'] },
        { id: 'KR', name: 'Hàn Quốc', keywords: ['hàn quốc', 'seoul', 'korea', 'south korea'] },
        { id: 'IN', name: 'Ấn Độ', keywords: ['ấn độ', 'new delhi', 'mumbai', 'india'] },

        // --- ĐIỂM NÓNG XUNG ĐỘT (QUÂN SỰ) ---
        { id: 'UA', name: 'Ukraine', keywords: ['ukraine', 'kyiv'] },
        { id: 'IL', name: 'Israel', keywords: ['israel', 'tel aviv', 'gaza', 'palestine'] },
        { id: 'IR', name: 'Iran', keywords: ['iran', 'tehran'] },

        // --- MỸ LATINH & CHÂU PHI (THƯỜNG KÍCH HOẠT NHỜ THIÊN TAI/BẠO LOẠN) ---
        { id: 'BR', name: 'Brazil', keywords: ['brazil', 'brasilia'] },
        { id: 'MX', name: 'Mexico', keywords: ['mexico', 'mexico city'] },
        { id: 'VE', name: 'Venezuela', keywords: ['venezuela', 'caracas'] },
        { id: 'AR', name: 'Argentina', keywords: ['argentina', 'buenos aires'] },
        { id: 'ZA', name: 'Nam Phi', keywords: ['nam phi', 'south africa'] },
        { id: 'EG', name: 'Ai Cập', keywords: ['ai cập', 'egypt'] },
        { id: 'NG', name: 'Nigeria', keywords: ['nigeria', 'abuja', 'lagos'] },

        // --- KHU VỰC CHUNG ---
        { id: 'global', name: 'Toàn cầu', keywords: ['toàn cầu', 'thế giới', 'wto', 'who', 'imf', 'lHQ', 'nato'] }
    ],

    SOURCE_DEFAULT_REGION: {
        'Reuters': 'global',
        'CNBC': 'US',
        'BBC News': 'global',
        'The Wall Street Journal': 'US',
        'Al Jazeera': 'IL' // Chuyển luồng tin Al Jazeera thẳng vào điểm nóng Trung Đông
    }
};

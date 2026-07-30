// FILE: script_bot/config/regions.js
module.exports = {
    REGIONS: [
        // ==========================================
        // 1. ĐÔNG NAM Á (ASEAN)
        // ==========================================
        { id: 'VN', name: 'Việt Nam', keywords: ['việt nam', 'hà nội', 'tphcm', 'chính phủ', 'miền trung', 'đồng bằng sông cửu long', 'vietnam'] },
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

        // ==========================================
        // 2. CHÂU Á & ĐÔNG BẮC Á / NAM Á
        // ==========================================
        { id: 'JP', name: 'Nhật Bản', keywords: ['nhật bản', 'tokyo', 'kyushu', 'osaka', 'japan'] },
        { id: 'KR', name: 'Hàn Quốc', keywords: ['hàn quốc', 'seoul', 'korea', 'south korea'] },
        { id: 'CN', name: 'Trung Quốc', keywords: ['trung quốc', 'bắc kinh', 'tập cận bình', 'china'] },
        { id: 'TW', name: 'Đài Loan', keywords: ['đài loan', 'taipei', 'taiwan'] },
        { id: 'IN', name: 'Ấn Độ', keywords: ['ấn độ', 'new delhi', 'mumbai', 'india'] },
        { id: 'PK', name: 'Pakistan', keywords: ['pakistan', 'islamabad'] },

        // ==========================================
        // 3. BẮC MỸ
        // ==========================================
        { id: 'US', name: 'Mỹ', keywords: ['mỹ', 'hoa kỳ', 'washington', 'fed', 'usa', 'biden', 'trump'] },
        { id: 'CA', name: 'Canada', keywords: ['canada', 'ottawa', 'trudeau'] },

        // ==========================================
        // 4. CHÂU ÂU (EUROPE)
        // ==========================================
        { id: 'GB', name: 'Anh', keywords: ['anh', 'vương quốc anh', 'uk', 'britain', 'london', 'rishi sunak', 'keir starmer'] },
        { id: 'DE', name: 'Đức', keywords: ['đức', 'germany', 'berlin', 'scholz'] },
        { id: 'FR', name: 'Pháp', keywords: ['pháp', 'france', 'paris', 'macron'] },
        { id: 'IT', name: 'Ý', keywords: ['ý', 'italy', 'rome', 'meloni'] },
        { id: 'ES', name: 'Tây Ban Nha', keywords: ['tây ban nha', 'spain', 'madrid'] },
        { id: 'NL', name: 'Hà Lan', keywords: ['hà lan', 'netherlands', 'amsterdam'] },
        { id: 'PL', name: 'Ba Lan', keywords: ['ba lan', 'poland', 'warsaw'] },
        { id: 'CH', name: 'Thụy Sĩ', keywords: ['thụy sĩ', 'switzerland', 'bern', 'geneva'] },
        { id: 'RU', name: 'Nga', keywords: ['nga', 'moscow', 'putin', 'russia'] },
        { id: 'UA', name: 'Ukraine', keywords: ['ukraine', 'kyiv', 'zelensky'] },

        // ==========================================
        // 5. CHÂU MỸ LATINH (LATIN AMERICA)
        // ==========================================
        { id: 'BR', name: 'Brazil', keywords: ['brazil', 'brasil', 'brasilia', 'lula'] },
        { id: 'MX', name: 'Mexico', keywords: ['mexico', 'mê-hi-cô', 'mexico city'] },
        { id: 'AR', name: 'Argentina', keywords: ['argentina', 'buenos aires', 'milei'] },
        { id: 'CO', name: 'Colombia', keywords: ['colombia', 'bogota'] },
        { id: 'CL', name: 'Chile', keywords: ['chile', 'santiago'] },
        { id: 'PE', name: 'Peru', keywords: ['peru', 'lima'] },
        { id: 'VE', name: 'Venezuela', keywords: ['venezuela', 'caracas', 'maduro'] },
        { id: 'CU', name: 'Cuba', keywords: ['cuba', 'havana'] },

        // ==========================================
        // 6. CHÂU PHI (AFRICA)
        // ==========================================
        { id: 'ZA', name: 'Nam Phi', keywords: ['nam phi', 'south africa', 'pretoria', 'cape town'] },
        { id: 'EG', name: 'Ai Cập', keywords: ['ai cập', 'egypt', 'cairo'] },
        { id: 'NG', name: 'Nigeria', keywords: ['nigeria', 'abuja', 'lagos'] },
        { id: 'KE', name: 'Kenya', keywords: ['kenya', 'nairobi'] },
        { id: 'ET', name: 'Ethiopia', keywords: ['ethiopia', 'addis ababa'] },
        { id: 'DZ', name: 'Algeria', keywords: ['algeria', 'algiers'] },
        { id: 'MA', name: 'Maroc', keywords: ['maroc', 'morocco', 'rabat'] },

        // ==========================================
        // 7. TRUNG ĐÔNG (MIDDLE EAST)
        // ==========================================
        { id: 'IL', name: 'Israel', keywords: ['israel', 'tel aviv', 'jerusalem', 'netanyahu'] },
        { id: 'IR', name: 'Iran', keywords: ['iran', 'tehran'] },
        { id: 'SA', name: 'Ả Rập Xê Út', keywords: ['ả rập xê út', 'saudi arabia', 'riyadh'] },
        { id: 'TR', name: 'Thổ Nhĩ Kỳ', keywords: ['thổ nhĩ kỳ', 'turkey', 'turkiye', 'ankara', 'erdogan'] },
        { id: 'AE', name: 'UAE', keywords: ['uae', 'các tiểu vương quốc ả rập thống nhất', 'dubai', 'abu dhabi'] },

        // ==========================================
        // 8. CHÂU ÚC (OCEANIA)
        // ==========================================
        { id: 'AU', name: 'Úc', keywords: ['Úc', 'australia', 'canberra', 'sydney', 'melbourne'] },
        { id: 'NZ', name: 'New Zealand', keywords: ['new zealand', 'wellington', 'auckland'] },

        // ==========================================
        // 9. CÁC KHU VỰC TỔNG HỢP / LIÊN MINH
        // ==========================================
        { id: 'eu', name: 'Châu Âu', keywords: ['châu âu', 'eu', 'liên minh châu âu', 'ecb'] },
        { id: 'middle_east', name: 'Trung Đông', keywords: ['trung đông', 'palestine', 'gaza', 'houthi', 'west bank'] },
        { id: 'latin_america', name: 'Mỹ Latinh', keywords: ['mỹ latinh', 'châu mỹ latinh', 'latin america'] },
        { id: 'africa', name: 'Châu Phi', keywords: ['châu phi', 'africa'] },
        { id: 'global', name: 'Toàn cầu', keywords: ['toàn cầu', 'thế giới', 'wto', 'who', 'world bank', 'imf', 'lHQ', 'nato', 'opec', 'brics'] }
    ],

    SOURCE_DEFAULT_REGION: {
        'Reuters': 'global',
        'CNBC': 'US',
        'BBC News': 'global',
        'The Wall Street Journal': 'US',
        'The Economist': 'global',
        'Al Jazeera': 'middle_east',
        'Financial Times': 'global',
        'Bloomberg': 'global',
        'France24': 'FR',
        'DW': 'DE'
    }
};

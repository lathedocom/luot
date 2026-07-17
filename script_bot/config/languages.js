// Cấu hình các ngôn ngữ nền tảng hỗ trợ xử lý

module.exports = {
    DEFAULT_LANGUAGE: 'VN',
    
    SUPPORTED_LANGUAGES: {
        VN: { code: 'vi', name: 'Tiếng Việt' },
        EN: { code: 'en', name: 'Tiếng Anh' },
        ZH: { code: 'zh', name: 'Tiếng Trung' },
        JP: { code: 'ja', name: 'Tiếng Nhật' }
    },

    // Các từ khóa giúp hệ thống nhận diện nhanh ngôn ngữ của bài báo (Rule-based)
    IDENTIFIERS: {
        VN: ["và", "của", "là", "trong", "người"],
        EN: ["the", "and", "is", "in", "for"],
        ZH: ["的", "和", "是", "在", "了"]
    }
};

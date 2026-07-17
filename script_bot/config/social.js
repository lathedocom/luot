// Đóng vai trò là Cờ hiệu (Feature Flags) cho các Plugin mạng xã hội.
// Bật (true) thì hệ thống mới chạy plugin đó, tắt (false) thì bỏ qua.

module.exports = {
    ENABLED_PLATFORMS: {
        REDDIT: true,      // Reddit dễ lấy dữ liệu, khuyên dùng
        FACEBOOK: false,   // Facebook thường xuyên chặn bot, tạm tắt
        THREADS: false,
        TWITTER: false,    // Twitter API tốn phí, tạm tắt
        TIKTOK: false,
        YOUTUBE: true      // YouTube lấy xu hướng khá tốt
    }
};

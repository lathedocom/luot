// Khai báo giới hạn Quota miễn phí theo chuẩn của Google
// Đơn vị: RPM (Requests Per Minute), RPD (Requests Per Day), TPM (Tokens Per Minute)

module.exports = {
    // Giới hạn cho model 3.1 Flash Lite
    FLASH_LITE: {
        MAX_RPM: 15,
        MAX_RPD: 500,
        MAX_TPM: 250000
    },
    
    // Giới hạn cho model Embedding
    EMBEDDING: {
        MAX_RPM: 100, // Embedding thường có quota cao hơn
        MAX_TPM: 30000
    },

    // Ngưỡng an toàn (Chỉ chạy đến % này thì tự động Fallback hoặc ngừng để không bị khóa API)
    SAFE_LIMIT_PERCENT: 0.95 // Ngừng khi đạt 95% giới hạn
};

module.exports = {
    // Giới hạn cho model Flash Lite (Tầng 2)
    FLASH_LITE: {
        MAX_RPM: 15,
        MAX_RPD: 500,
        MAX_TPM: 250000
    },
    
    // Giới hạn cho các mô hình cao cấp Flash Premium (Tầng 3)
    FLASH_PREMIUM: {
        MAX_RPM: 5,
        MAX_RPD: 20,
        MAX_TPM: 250000
    },
    
    // Giới hạn cho Gemma (Tầng 1)
    GEMMA: {
        MAX_RPM: 30,
        MAX_RPD: 14400,
        MAX_TPM: 16000
    },
    
    // Giới hạn cho model Embedding (Tầng 0)
    EMBEDDING: {
        MAX_RPM: 100, 
        MAX_TPM: 30000,
        MAX_RPD: 1000
    },

    SAFE_LIMIT_PERCENT: 0.95 
};

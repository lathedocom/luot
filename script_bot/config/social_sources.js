// FILE: script_bot/config/social_sources.js

const X_ACCOUNTS_TO_WATCH = [
    { handle: 'elonmusk', label: 'Elon Musk' },
    { handle: 'realDonaldTrump', label: 'Donald Trump' },
    { handle: 'OpenAI', label: 'OpenAI' },
    { handle: 'federalreserve', label: 'Federal Reserve' }
];

const TELEGRAM_CHANNELS_TO_WATCH = [
    { username: 'crypto', label: 'Crypto News' },
    // (Thêm danh sách cụ thể do người dùng cung cấp sau)
];

module.exports = {
    X_ACCOUNTS_TO_WATCH,
    TELEGRAM_CHANNELS_TO_WATCH
};

// FILE: script_bot/modules/market/sources/construction.js

async function fetchSteelPrice() {
    return {
        indicator_id: "vn_steel_cb300",
        name: "Thép CB300",
        value: 14.2, // Giá tham chiếu mặc định (có thể viết thêm logic cào web nếu cần)
        unit: "Tr/tấn",
        country: "VN",
        frequency: "monthly",
        source: { name: "Giá tham chiếu nội bộ", type: "static" },
        quality: { status: "verified", method: "static" },
        retrieved_at: new Date().toISOString()
    };
}

async function fetchCementPrice() {
    return {
        indicator_id: "vn_cement",
        name: "Xi măng",
        value: 1.5,
        unit: "Tr/tấn",
        country: "VN",
        frequency: "monthly",
        source: { name: "Giá tham chiếu nội bộ", type: "static" },
        quality: { status: "verified", method: "static" },
        retrieved_at: new Date().toISOString()
    };
}

module.exports = { fetchSteelPrice, fetchCementPrice };

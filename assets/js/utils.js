// ==========================================================================
// FILE: assets/js/utils.js
// ==========================================================================

export const REGION_NAMES = {
    vietnam: 'Việt Nam',
    usa: 'Mỹ',
    china: 'Trung Quốc',
    eu: 'Châu Âu',
    asean: 'Đông Nam Á',
    global: 'Toàn cầu'
};

export function getRegionLabel(regionId) {
    return REGION_NAMES[regionId] || 'Thế giới';
}

export function escapeHtml(unsafe) {
    if (!unsafe) return '';
    if (typeof unsafe !== 'string') return String(unsafe);
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Hàm mới: Format thời gian theo múi giờ Việt Nam
export function formatVietnamTime(timestamp) {
    if (!timestamp) return "Vừa cập nhật";
    const dateObj = new Date(timestamp);
    if (isNaN(dateObj.getTime())) return "Vừa cập nhật";

    const formatter = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: false
    });

    const parts = formatter.formatToParts(dateObj);
    const hour = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;
    const day = parts.find(p => p.type === 'day').value;
    const month = parts.find(p => p.type === 'month').value;
    const year = parts.find(p => p.type === 'year').value;

    return `${hour}:${minute} - ${day}/${month}/${year}`;
}

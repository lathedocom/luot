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

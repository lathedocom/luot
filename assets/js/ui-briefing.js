// assets/js/ui-briefing.js
export function renderBriefing(briefingText) {
    const briefingContainer = document.getElementById('briefing-container');
    if (!briefingContainer) return;

    if (briefingText) {
        // Đổ trực tiếp HTML được sinh bởi AI
        briefingContainer.innerHTML = `<div class="briefing-content" style="line-height: 1.7; font-size: 15px;">${briefingText}</div>`;
    } else {
        briefingContainer.innerHTML = '<p style="opacity:0.7;">Chưa có bản tin tóm tắt cho chu kỳ này.</p>';
    }
}

// ==========================================================================
// FILE: assets/js/ui-briefing.js
// ==========================================================================

/**
 * Hàm phân tích và định dạng văn bản AI thành HTML chuyên nghiệp
 * Tự động nhận diện và làm nổi bật các khu vực: Việt Nam, ASEAN, Mỹ, Toàn cầu
 */
function formatBriefingText(text) {
    if (!text) return '';

    // Nếu văn bản đã có sẵn thẻ HTML chuẩn, trả về luôn
    if (text.includes('<p>') && text.includes('</p>')) return text;

    // 1. Nhận diện và chuẩn hóa các tiêu đề khu vực
    // Bắt các trường hợp AI viết: "**Việt Nam:**", "1. Việt Nam", "## VIỆT NAM", "MỸ:"...
    let processedText = text
        .replace(/^(?:\W*\d+\.\s*)?\**\b(Việt Nam|VN|ASEAN|Mỹ|Hoa Kỳ|US|USA|Toàn cầu|Thế giới)\b\**[:\-]?/gim, '## $1')
        // Chuyển in đậm tiêu chuẩn
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 2. Chuyển đổi Markdown sang HTML với CSS tối ưu
    let html = processedText
        // Xử lý các tiêu đề khu vực (Heading 2) thành các khối nổi bật
        .replace(/^## (.*$)/gim, (match, p1) => {
            const title = p1.trim().toUpperCase();
            let icon = 'public'; // Icon mặc định
            
            // Tùy biến icon theo khu vực
            if (title.includes('VIỆT NAM') || title.includes('VN')) icon = 'star';
            else if (title.includes('MỸ') || title.includes('HOA KỲ')) icon = 'attach_money';
            else if (title.includes('ASEAN')) icon = 'group_work';
            else if (title.includes('TOÀN CẦU') || title.includes('THẾ GIỚI')) icon = 'language';

            return `
                <div style="
                    background: var(--md-sys-color-primary-container, #e8def8);
                    color: var(--md-sys-color-on-primary-container, #1d192b);
                    padding: 12px 16px;
                    margin: 32px 0 16px 0;
                    border-left: 5px solid var(--md-sys-color-primary, #6750a4);
                    border-radius: 0 8px 8px 0;
                    font-size: 16px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">
                    <span class="material-icons-round" style="font-size: 20px;">${icon}</span>
                    ${title}
                </div>
            `;
        })
        // Xử lý Heading 3 (###)
        .replace(/^### (.*$)/gim, '<h3 style="margin: 24px 0 12px 0; font-size: 15px; color: var(--md-sys-color-primary); font-weight: 600;">$1</h3>')
        // Xử lý gạch đầu dòng (List)
        .replace(/^\s*[-*]\s+(.*)$/gim, '<li style="margin-bottom: 10px; line-height: 1.7;">$1</li>');

    // 3. Xử lý xuống dòng, bọc thẻ <p> và <ul>
    let paragraphs = html.split(/\n\n+/); // Tách bằng khoảng trống kép
    html = paragraphs.map(p => {
        let trimmed = p.trim();
        if (!trimmed) return '';
        
        // Nếu là thẻ div tiêu đề hoặc h3, giữ nguyên
        if (trimmed.startsWith('<div') || trimmed.startsWith('<h3')) {
            return trimmed;
        }
        
        // Nếu là thẻ li, nhóm chúng lại (tạm thời để thẻ li tự do sẽ được gom bằng regex sau)
        if (trimmed.startsWith('<li')) {
            return trimmed;
        }

        // Thay khoảng xuống dòng đơn thành thẻ <br>
        trimmed = trimmed.replace(/\n/g, '<br>');
        
        // Bọc trong thẻ <p> với khoảng cách dễ đọc
        return `<p style="margin-bottom: 16px; line-height: 1.7; color: var(--md-sys-color-on-surface, #1d1b20); text-align: justify;">${trimmed}</p>`;
    }).join('');

    // Gom các thẻ <li> đứng cạnh nhau vào trong 1 thẻ <ul>
    html = html.replace(/(<li.*?>.*?<\/li>(\s|<br>)*)+/g, match => `
        <ul style="
            margin: 0 0 20px 0; 
            padding-left: 24px; 
            color: var(--md-sys-color-on-surface, #1d1b20);
        ">
            ${match.replace(/<br>/g, '')}
        </ul>
    `);

    // Highlight text in đậm
    html = html.replace(/<strong>/g, '<strong style="color: var(--md-sys-color-on-surface); font-weight: 600;">');

    return html;
}

export function renderBriefing(briefingText) {
    const briefingContainer = document.getElementById('briefing-container');
    if (!briefingContainer) return;

    if (briefingText) {
        // Xử lý AI text trước khi đổ vào DOM
        const formattedHtml = formatBriefingText(briefingText);

        briefingContainer.innerHTML = `
            <div class="briefing-content" style="
                font-size: 15px; 
                max-width: 100%;
                box-sizing: border-box;
                font-family: system-ui, -apple-system, sans-serif;
            ">
                ${formattedHtml}
            </div>
        `;
    } else {
        briefingContainer.innerHTML = `
            <div style="text-align: center; padding: 32px 16px; color: var(--md-sys-color-on-surface-variant); opacity: 0.7; font-style: italic;">
                <span class="material-icons-round" style="font-size: 32px; display: block; margin-bottom: 8px; opacity: 0.5;">article</span>
                Chưa có bản tin tóm tắt cho chu kỳ này.
            </div>
        `;
    }
}

// assets/js/ui-briefing.js

/**
 * Hàm phụ trợ để format văn bản AI (Plain Text / Markdown) thành HTML dễ nhìn
 */
function formatAIText(text) {
    if (!text) return '';

    // Nếu AI đã trả về sẵn mã HTML chuẩn (có thẻ <p>, <br>), ta giữ nguyên
    if (text.includes('<p>') && text.includes('</p>')) {
        return text;
    }

    // Nếu là dạng Text/Markdown, tiến hành convert sang HTML
    let formattedHtml = text
        // Xử lý in đậm **text**
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Xử lý Heading cấp 2 (## Title)
        .replace(/^## (.*$)/gim, '<h2 style="margin-top: 1.5em; margin-bottom: 0.5em; font-size: 1.3em; color: #111; border-bottom: 1px solid #eaeaea; padding-bottom: 8px;">$1</h2>')
        // Xử lý Heading cấp 3 (### Title)
        .replace(/^### (.*$)/gim, '<h3 style="margin-top: 1.2em; margin-bottom: 0.5em; font-size: 1.1em; color: #222;">$1</h3>')
        // Xử lý Gạch đầu dòng (- item hoặc * item)
        .replace(/^\s*[-*]\s+(.*)$/gim, '<li style="margin-left: 20px; margin-bottom: 8px;">$1</li>')
        // Xử lý xuống dòng thành các đoạn văn <p>
        .split(/\n\n+/) // Tách bằng 2 dấu enter trở lên
        .map(paragraph => {
            let p = paragraph.trim();
            if (!p) return '';
            // Nếu đã là thẻ h2, h3, li thì không bọc thẻ <p>
            if (p.startsWith('<h') || p.startsWith('<li')) {
                return p;
            }
            // Các dòng xuống dòng đơn lẻ trong cùng 1 đoạn sẽ thành <br>
            p = p.replace(/\n/g, '<br>');
            return `<p style="margin-bottom: 16px;">${p}</p>`;
        })
        .join('');

    return formattedHtml;
}

export function renderBriefing(briefingText) {
    const briefingContainer = document.getElementById('briefing-container');
    if (!briefingContainer) return;

    if (briefingText) {
        // Gọi hàm format trước khi render
        const cleanHTML = formatAIText(briefingText);

        // Đổ HTML vào container kèm theo CSS nội tuyến (Inline CSS) cải thiện Typography
        briefingContainer.innerHTML = `
            <div class="briefing-content" style="
                line-height: 1.8; 
                font-size: 16px; 
                color: #333; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px; 
                background-color: #fafafa;
                border-radius: 8px;
                border: 1px solid #eee;
            ">
                ${cleanHTML}
            </div>
        `;
    } else {
        briefingContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #888; font-style: italic;">
                Chưa có bản tin tóm tắt cho chu kỳ này.
            </div>
        `;
    }
}

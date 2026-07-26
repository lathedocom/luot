// ==========================================================================
// FILE: assets/js/ui-briefing.js
// ==========================================================================

/**
 * Hàm phân tích và định dạng văn bản AI
 */
function formatBriefingText(text) {
    if (!text) return '';

    // Tách các đoạn bằng ký tự xuống dòng
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    let html = '';

    paragraphs.forEach(p => {
        let trimmed = p.trim();
        if (!trimmed) return;

        // Nhận diện Tiêu đề khu vực: 
        // Bắt các dòng bắt đầu bằng Emoji (Quốc kỳ) hoặc dòng viết hoa toàn bộ kết thúc bằng dấu ":"
        const isHeading = /^[\uD83C-\uDBFF\uDC00-\uDFFF]/.test(trimmed) || 
                          /^([A-ZĐÁÀẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ\s]+):/i.test(trimmed);

        if (isHeading) {
            html += `
                <div style="
                    background: var(--md-sys-color-surface-variant, rgba(255, 255, 255, 0.1));
                    color: var(--md-sys-color-on-surface, #ffffff);
                    padding: 12px 16px;
                    margin: 28px 0 12px 0;
                    border-left: 4px solid var(--md-sys-color-primary, #a8c7fa);
                    border-radius: 0 6px 6px 0;
                    font-size: 15px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">
                    ${trimmed}
                </div>
            `;
        } else {
            // Các đoạn văn bản thông thường sẽ có chữ màu xám sáng (kế thừa giao diện), tự động căn đều
            html += `<p style="margin-bottom: 16px; line-height: 1.7; font-size: 15px; color: var(--md-sys-color-on-surface, #e3e3e3); text-align: justify; opacity: 0.95;">${trimmed}</p>`;
        }
    });

    // Highlight các chữ được in đậm bằng dấu ** (nếu có)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--md-sys-color-primary, #a8c7fa); font-weight: 700;">$1</strong>');

    return html;
}

export function renderBriefing(briefingText) {
    const briefingContainer = document.getElementById('briefing-container');
    if (!briefingContainer) return;

    if (briefingText) {
        let actualContent = briefingText;

        // BƯỚC 1: Cố gắng bóc tách nội dung thật nếu AI trả về chuỗi JSON rác
        try {
            // Xóa bớt rác đằng sau chuỗi nếu có (ví dụ: `}]"  "`)
            let cleanString = briefingText.replace(/\]\}"\s*"$/, ']}');
            
            // Ép kiểu phân tích JSON (lấy property "content" bên trong mảng)
            if (typeof cleanString === 'string' && cleanString.trim().startsWith('[')) {
                const parsed = JSON.parse(cleanString.trim());
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].content) {
                    actualContent = parsed[0].content;
                }
            }
        } catch (e) {
            // Fallback: Nếu parse lỗi, dùng Regex để móc nội dung "content"
            const match = briefingText.match(/"content"\s*:\s*"(.*?)"/s);
            if (match && match[1]) {
                actualContent = match[1];
            }
        }

        // Đảm bảo các ký tự \n dạng chuỗi được chuyển thành xuống dòng thực sự
        actualContent = actualContent.replace(/\\n/g, '\n');

        // BƯỚC 2: Định dạng thành HTML dễ đọc
        const formattedHtml = formatBriefingText(actualContent);

        // BƯỚC 3: Render vào khung
        // Dùng background: transparent và kế thừa màu sắc để đồng bộ hoàn toàn với nền tối
        briefingContainer.innerHTML = `
            <div class="briefing-content" style="
                font-family: system-ui, -apple-system, sans-serif;
                background: transparent;
                color: var(--md-sys-color-on-surface, inherit);
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
            ">
                ${formattedHtml}
            </div>
        `;
    } else {
        briefingContainer.innerHTML = `
            <div style="text-align: center; padding: 32px 16px; color: inherit; opacity: 0.7; font-style: italic;">
                <span class="material-icons-round" style="font-size: 32px; display: block; margin-bottom: 8px; opacity: 0.5;">article</span>
                Chưa có bản tin tóm tắt cho chu kỳ này.
            </div>
        `;
    }
}

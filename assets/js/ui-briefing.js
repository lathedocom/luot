// ==========================================================================
// FILE: assets/js/ui-briefing.js
// ==========================================================================

function formatBriefingText(text) {
    if (!text) return '';
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    let html = '';

    paragraphs.forEach(p => {
        let trimmed = p.trim();
        if (!trimmed) return;

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
            html += `<p style="margin-bottom: 16px; line-height: 1.7; font-size: 15px; color: var(--md-sys-color-on-surface, #e3e3e3); text-align: justify; opacity: 0.95;">${trimmed}</p>`;
        }
    });

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--md-sys-color-primary, #a8c7fa); font-weight: 700;">$1</strong>');
    return html;
}

// Hàm phụ: Chỉ render nội dung text vào container
function renderBriefingContent(briefingText) {
    const briefingContainer = document.getElementById('briefing-container');
    if (!briefingContainer) return;

    if (!briefingText) {
        briefingContainer.innerHTML = `
            <div style="text-align: center; padding: 32px 16px; color: inherit; opacity: 0.7; font-style: italic;">
                <span class="material-icons-round" style="font-size: 32px; display: block; margin-bottom: 8px; opacity: 0.5;">article</span>
                Chưa có bản tin tóm tắt.
            </div>`;
        return;
    }

    let actualContent = briefingText;
    try {
        let cleanString = briefingText.replace(/\]\}"\s*"$/, ']}');
        if (typeof cleanString === 'string' && cleanString.trim().startsWith('[')) {
            const parsed = JSON.parse(cleanString.trim());
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].content) {
                actualContent = parsed[0].content;
            }
        }
    } catch (e) {
        const match = briefingText.match(/"content"\s*:\s*"(.*?)"/s);
        if (match && match[1]) {
            actualContent = match[1];
        }
    }

    actualContent = actualContent.replace(/\\n/g, '\n');
    const formattedHtml = formatBriefingText(actualContent);

    briefingContainer.innerHTML = `
        <div class="briefing-content" style="
            font-family: system-ui, -apple-system, sans-serif;
            background: transparent;
            color: var(--md-sys-color-on-surface, inherit);
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            animation: fadeIn 0.3s ease;
        ">
            ${formattedHtml}
        </div>
        <style>@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }</style>
    `;
}

// Hàm phụ: Render các nút ngày tháng
function renderHistoryButtons(historyArray, activeIndex) {
    const buttonsContainer = document.getElementById('briefing-history-buttons');
    const wrapper = document.getElementById('briefing-history-wrapper');
    
    if (!buttonsContainer || !wrapper) return;

    // Nếu không có lịch sử (chỉ có 1 bài hôm nay), ẩn vùng nút đi
    if (!historyArray || historyArray.length <= 1) {
        wrapper.style.display = 'none';
        return;
    }
    
    wrapper.style.display = 'block';
    buttonsContainer.innerHTML = '';

    historyArray.forEach((item, index) => {
        let label = "Ngày cũ";
        if (item.date) {
            const dateObj = new Date(item.date);
            if (!isNaN(dateObj.getTime())) {
                label = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
            }
        }
        
        // Ghi đè label cho 2 ngày gần nhất
        if (index === 0) label = "Hôm nay";
        else if (index === 1) label = "Hôm qua";

        const btn = document.createElement('button');
        const isActive = index === activeIndex;
        
        btn.textContent = label;
        btn.style.cssText = `
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            cursor: pointer;
            border: 1px solid ${isActive ? 'transparent' : 'var(--md-sys-color-outline)'};
            background-color: ${isActive ? 'var(--md-sys-color-primary)' : 'transparent'};
            color: ${isActive ? '#ffffff' : 'var(--md-sys-color-on-surface)'};
            transition: all 0.2s ease;
            flex-shrink: 0;
        `;

        btn.addEventListener('click', () => {
            // Khi người dùng bấm, render nội dung của ngày đó và tô màu lại nút
            renderBriefingContent(item.content);
            renderHistoryButtons(historyArray, index);
        });

        buttonsContainer.appendChild(btn);
    });
}

// Hàm chính (export ra cho api.js gọi)
export function renderBriefing(briefingData) {
    // Nếu dữ liệu truyền vào là một mảng lịch sử (Backend đã cập nhật)
    if (Array.isArray(briefingData) && briefingData.length > 0) {
        // Mặc định hiển thị bản tin đầu tiên (Hôm nay - index 0)
        renderBriefingContent(briefingData[0].content);
        renderHistoryButtons(briefingData, 0);
    } 
    // Nếu backend chưa cập nhật, vẫn trả về chuỗi text như cũ (Tương thích ngược)
    else if (typeof briefingData === 'string' || typeof briefingData === 'object') {
        renderBriefingContent(briefingData);
        // Giả lập lịch sử với 1 bài duy nhất để không bị lỗi
        renderHistoryButtons([{ date: new Date().toISOString(), content: briefingData }], 0);
    }
    // Không có dữ liệu
    else {
        renderBriefingContent(null);
        renderHistoryButtons([], 0);
    }
}

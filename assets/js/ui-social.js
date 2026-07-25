// ==========================================================================
// FILE: assets/js/ui-social.js
// ==========================================================================
import { escapeHtml } from './utils.js';

// Biến toàn cục để lưu dữ liệu MXH phục vụ cho việc Lọc (Filter)
let currentSocialData = [];

export function renderSocial(socialData) {
    const container = document.getElementById('social-container');
    
    // Lưu lại dữ liệu để dùng cho filter
    if (socialData && socialData.length > 0) {
        currentSocialData = socialData;
    }

    if (!currentSocialData || currentSocialData.length === 0) {
        container.innerHTML = '<p style="opacity: 0.7; font-size: 13px;">Chưa có dữ liệu thảo luận.</p>';
        return;
    }

    // --- 1. RENDER THANH FILTER (TABS) ---
    // Kiểm tra xem đã có thanh filter chưa, nếu chưa thì tạo
    let filterContainer = document.getElementById('social-filter-tabs');
    if (!filterContainer) {
        // Chèn HTML thanh Filter vào trước nội dung list
        const filterHtml = `
            <div id="social-filter-tabs" style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; padding-bottom: 12px; border-bottom: 1px solid var(--md-sys-color-outline);">
                <button class="social-tab active" data-platform="all" style="background: var(--md-sys-color-primary); color: #fff; border: none; padding: 6px 12px; border-radius: 16px; font-size: 12px; font-weight: bold; cursor: pointer; transition: 0.2s;">Tất cả</button>
                <button class="social-tab" data-platform="x" style="background: transparent; color: var(--md-sys-color-on-surface); border: 1px solid var(--md-sys-color-outline); padding: 6px 12px; border-radius: 16px; font-size: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: 0.2s;">
                    <span class="material-icons-round" style="font-size: 14px;">close</span> X
                </button>
                <button class="social-tab" data-platform="telegram" style="background: transparent; color: var(--md-sys-color-on-surface); border: 1px solid var(--md-sys-color-outline); padding: 6px 12px; border-radius: 16px; font-size: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: 0.2s;">
                    <span class="material-icons-round" style="font-size: 14px; color: #24A1DE;">send</span> Telegram
                </button>
                <button class="social-tab" data-platform="youtube" style="background: transparent; color: var(--md-sys-color-on-surface); border: 1px solid var(--md-sys-color-outline); padding: 6px 12px; border-radius: 16px; font-size: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: 0.2s;">
                    <span class="material-icons-round" style="font-size: 14px; color: #FF0000;">play_circle</span> YouTube
                </button>
                <button class="social-tab" data-platform="reddit" style="background: transparent; color: var(--md-sys-color-on-surface); border: 1px solid var(--md-sys-color-outline); padding: 6px 12px; border-radius: 16px; font-size: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: 0.2s;">
                    <span class="material-icons-round" style="font-size: 14px; color: #FF4500;">reddit</span> Reddit
                </button>
            </div>
            <div id="social-list-content"></div>
        `;
        container.innerHTML = filterHtml;

        // Gắn sự kiện Click cho các nút Filter
        document.querySelectorAll('.social-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Đổi style nút Active
                document.querySelectorAll('.social-tab').forEach(b => {
                    b.style.background = 'transparent';
                    b.style.color = 'var(--md-sys-color-on-surface)';
                    b.classList.remove('active');
                });
                const clickedBtn = e.currentTarget;
                clickedBtn.style.background = 'var(--md-sys-color-primary)';
                clickedBtn.style.color = '#fff';
                clickedBtn.classList.add('active');

                // Lọc và Render lại List
                const platform = clickedBtn.getAttribute('data-platform');
                renderSocialList(platform);
            });
        });
    }

    // Render danh sách (Mặc định là All)
    renderSocialList('all');
}

// Hàm phụ trợ chịu trách nhiệm vẽ Danh sách MXH theo Nền tảng được chọn
function renderSocialList(platformFilter) {
    const listContainer = document.getElementById('social-list-content');
    if (!listContainer) return;

    // 1. Lọc dữ liệu theo Nền tảng (Platform)
    let filteredData = currentSocialData;
    if (platformFilter !== 'all') {
        filteredData = currentSocialData.filter(item => {
            const src = (item.source || item.platform || '').toLowerCase();
            return src === platformFilter;
        });
    }

    if (filteredData.length === 0) {
        listContainer.innerHTML = `<p style="opacity: 0.7; font-size: 13px; padding-top: 10px;">Chưa có cập nhật từ ${platformFilter.toUpperCase()}.</p>`;
        return;
    }

    // 2. Sắp xếp dữ liệu mới nhất lên đầu
    filteredData.sort((a, b) => {
        const timeA = a.time || a.timestamp || 0;
        const timeB = b.time || b.timestamp || 0;
        return timeB - timeA;
    });

    // 3. Gom nhóm theo Ngày (Date Grouping)
    const groupedData = [];
    filteredData.forEach(item => {
        // Ưu tiên dùng time/timestamp có sẵn, nếu không có thì lấy thời gian hiện tại
        const timeObj = (item.time || item.timestamp) ? new Date(item.time || item.timestamp) : new Date();
        const dateStr = timeObj.toLocaleDateString('vi-VN'); // Chuẩn "25/07/2026"
        
        let group = groupedData.find(g => g.dateStr === dateStr);
        if (!group) {
            group = { dateStr, items: [] };
            groupedData.push(group);
        }
        group.items.push(item);
    });

    // 4. Render ra HTML
    let html = '';
    
    groupedData.forEach(group => {
        // Dải phân cách Ngày
        html += `
            <div style="display: flex; align-items: center; margin: 16px 0 8px; opacity: 0.8;">
                <div style="flex-grow: 1; height: 1px; background: var(--md-sys-color-outline);"></div>
                <span style="padding: 0 10px; font-size: 11px; font-weight: bold; color: var(--md-sys-color-primary); text-transform: uppercase;">Ngày ${escapeHtml(group.dateStr)}</span>
                <div style="flex-grow: 1; height: 1px; background: var(--md-sys-color-outline);"></div>
            </div>
        `;

        // Lặp từng item trong Ngày
        group.items.forEach(item => {
            const srcLower = (item.source || item.platform || '').toLowerCase();
            let sourceIcon = 'tag'; 
            let iconColor = 'var(--md-sys-color-primary)';
            
            if (srcLower === 'x' || srcLower === 'twitter') {
                sourceIcon = 'close'; 
                iconColor = 'var(--md-sys-color-on-surface)'; 
            } else if (srcLower === 'telegram') {
                sourceIcon = 'send'; 
                iconColor = '#24A1DE'; 
            } else if (srcLower === 'youtube') {
                sourceIcon = 'play_circle';
                iconColor = '#FF0000';
            } else if (srcLower === 'reddit') {
                sourceIcon = 'reddit';
                iconColor = '#FF4500';
            }

            const keywordText = escapeHtml(item.keyword || 'Trending');
            
            // Format thời gian hiển thị nhỏ bên phải (VD: "10:30")
            let timeLabel = '';
            if (item.time || item.timestamp) {
                const tObj = new Date(item.time || item.timestamp);
                timeLabel = `${tObj.getHours().toString().padStart(2,'0')}:${tObj.getMinutes().toString().padStart(2,'0')}`;
            }

            const titleHtml = item.url 
                ? `<a href="${escapeHtml(item.url)}" target="_blank" style="color: inherit; text-decoration: none; display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                     <div style="display: flex; align-items: flex-start; gap: 6px;">
                         <span class="material-icons-round" style="font-size: 16px; color: ${iconColor}; margin-top: 1px;">${sourceIcon}</span>
                         <span>${keywordText}</span>
                     </div>
                     <span style="font-size: 11px; opacity: 0.6; font-weight: normal;">${timeLabel}</span>
                   </a>`
                : `<div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                     <div style="display: flex; align-items: flex-start; gap: 6px;">
                         <span class="material-icons-round" style="font-size: 16px; color: ${iconColor}; margin-top: 1px;">${sourceIcon}</span>
                         <span>${keywordText}</span>
                     </div>
                     <span style="font-size: 11px; opacity: 0.6; font-weight: normal;">${timeLabel}</span>
                   </div>`;

            html += `
                <div style="padding: 12px 0; border-bottom: 1px dashed var(--md-sys-color-outline);">
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: var(--md-sys-color-on-surface); transition: color 0.2s;" 
                         onmouseover="this.style.color='var(--md-sys-color-primary)'" 
                         onmouseout="this.style.color='var(--md-sys-color-on-surface)'">
                        ${titleHtml}
                    </div>
                    <div style="font-size: 13px; opacity: 0.85; line-height: 1.5; word-break: break-word; padding-left: 22px;">
                        ${escapeHtml(item.summary || item.content || 'Thảo luận đang tăng cao...')}
                    </div>
                </div>
            `;
        });
    });
    
    listContainer.innerHTML = html;
}

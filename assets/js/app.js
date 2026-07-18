/**
 * LƯỚT AI Newsroom - Giao diện hiển thị (Front-end Logic)
 */

document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    fetchNewsData();
});

// 1. CHỨC NĂNG CHUYỂN ĐỔI SÁNG/TỐI (DARK MODE)
function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    const icon = btn.querySelector('.material-icons-round');
    
    // Kiểm tra cài đặt cũ đã lưu trong máy người dùng
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.add(savedTheme);
        icon.textContent = savedTheme === 'dark-theme' ? 'light_mode' : 'dark_mode';
    }

    btn.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-theme') || 
                      (!document.body.classList.contains('light-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDark) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            icon.textContent = 'dark_mode';
            localStorage.setItem('theme', 'light-theme');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            icon.textContent = 'light_mode';
            localStorage.setItem('theme', 'dark-theme');
        }
    });
}

// 2. TẢI DỮ LIỆU TỪ FILE JSON CỦA BOT
async function fetchNewsData() {
    try {
        // Tải dữ liệu từ thư mục gốc
        const response = await fetch(`news_data.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Không thể tải file news_data.json');
        
        const data = await response.json();
        renderDashboard(data);
    } catch (error) {
        document.getElementById('news-container').innerHTML = `
            <div class="card" style="border-left: 4px solid red;">
                <h3 class="card-title">⚠️ Lỗi kết nối dữ liệu</h3>
                <p class="card-summary">${error.message}</p>
                <p class="card-summary" style="margin-top:10px; font-size:13px; opacity:0.7">
                    Đảm bảo file news_data.json đang nằm ở thư mục gốc và Bot đã chạy thành công.
                </p>
            </div>
        `;
    }
}

// 3. LẮP RÁP DỮ LIỆU LÊN GIAO DIỆN (ĐÃ ĐỒNG BỘ CẤU TRÚC JSON V4)
function renderDashboard(data) {
    // A. Render Thị trường
    const marketContainer = document.getElementById('market-container');
    if (data.market_data && data.market_data.length > 0) {
        let marketHTML = `<div class="card" style="display:flex; gap:16px; overflow-x:auto; padding:12px 20px;">`;
        data.market_data.forEach(item => {
            const isUp = item.trend === '↑' || item.trend === 'up'; // Tương thích ký hiệu mũi tên
            const color = isUp ? '#00b050' : '#ff0000';
            const icon = isUp ? 'trending_up' : 'trending_down';
            marketHTML += `
                <div style="min-width:120px; text-align:center;">
                    <strong style="display:block; font-size:14px;">${item.symbol}</strong>
                    <span style="color:${color}; font-weight:bold; display:flex; align-items:center; justify-content:center; gap:4px;">
                        ${item.price} <span class="material-icons-round" style="font-size:16px;">${icon}</span>
                    </span>
                </div>
            `;
        });
        marketHTML += `</div>`;
        marketContainer.innerHTML = marketHTML;
    }

    // B. Render Báo cáo AI (Sidebar)
    const briefingContainer = document.getElementById('briefing-container');
    if (data.daily_briefing) {
        briefingContainer.innerHTML = `
            <div class="card" style="background-color: var(--md-sys-color-surface-variant); border: none;">
                <h3 class="card-title" style="display:flex; align-items:center; gap:8px;">
                    <span class="material-icons-round" style="color:var(--md-sys-color-primary)">smart_toy</span>
                    AI Briefing
                </h3>
                <div class="card-summary" style="white-space: pre-wrap;">${data.daily_briefing}</div>
            </div>
        `;
    } else {
        briefingContainer.innerHTML = `<div class="card"><p>AI đang tổng hợp báo cáo...</p></div>`;
    }

    // C. Render Cụm Tin Tức (Cột chính)
    const newsContainer = document.getElementById('news-container');
    if (data.news && data.news.length > 0) {
        let newsHTML = '';
        data.news.forEach((cluster, index) => {
            const leadSource = cluster.sources && cluster.sources.length > 0 ? cluster.sources[0] : { url: '#', source_name: 'Tổng hợp' };
            const otherArticlesCount = cluster.sources ? cluster.sources.length - 1 : 0;
            
            const timeObj = new Date(cluster.timestamp);
            const timeString = timeObj.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) + ' - ' + timeObj.toLocaleDateString('vi-VN');
            const hotBadge = (cluster.hot_score && cluster.hot_score >= 20) ? '<span style="color:#e53935; margin-left:4px; font-size:11px;">🔥 HOT</span>' : '';

            newsHTML += `
                <article class="card">
                    <span style="font-size:12px; font-weight:bold; color:var(--md-sys-color-primary); text-transform:uppercase;">
                        CỤM SỰ KIỆN #${index + 1} ${hotBadge}
                    </span>
                    <h2 class="card-title" style="margin-top:8px;">
                        <a href="${leadSource.url}" target="_blank" style="color:inherit; text-decoration:none;">
                            ${cluster.title}
                        </a>
                    </h2>
                    <p class="card-summary">${cluster.short_summary}</p>
                    
                    <div style="margin-top:16px; font-size:13px; opacity:0.7; display:flex; gap:16px;">
                        <span><span class="material-icons-round" style="font-size:14px; vertical-align:middle;">newspaper</span> ${leadSource.source_name}</span>
                        <span><span class="material-icons-round" style="font-size:14px; vertical-align:middle;">schedule</span> ${timeString}</span>
                    </div>
                    
                    ${otherArticlesCount > 0 ? `
                        <div style="margin-top:16px; padding-top:12px; border-top:1px dashed var(--md-sys-color-outline); font-size:14px;">
                            <span class="material-icons-round" style="font-size:16px; vertical-align:middle; color:var(--md-sys-color-primary);">account_tree</span>
                            Có <strong>${otherArticlesCount}</strong> bài viết khác cùng chủ đề này.
                        </div>
                    ` : ''}
                </article>
            `;
        });
        newsContainer.innerHTML = newsHTML;
    } else {
        newsContainer.innerHTML = `<div class="card"><p>Chưa có dữ liệu sự kiện nào được gom cụm.</p></div>`;
    }
}

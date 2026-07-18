document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    fetchNewsData();
    initModalEvents();
});

// 1. CHUYỂN ĐỔI SÁNG/TỐI (DARK MODE)
function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    const icon = btn.querySelector('.material-icons-round');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        document.body.classList.add(savedTheme);
        icon.textContent = savedTheme === 'dark-theme' ? 'light_mode' : 'dark_mode';
    }

    btn.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-theme') || 
                      (!document.body.classList.contains('light-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDark) {
            document.body.classList.remove('dark-theme'); document.body.classList.add('light-theme');
            icon.textContent = 'dark_mode'; localStorage.setItem('theme', 'light-theme');
        } else {
            document.body.classList.remove('light-theme'); document.body.classList.add('dark-theme');
            icon.textContent = 'light_mode'; localStorage.setItem('theme', 'dark-theme');
        }
    });
}

// 2. TẢI DỮ LIỆU JSON
let globalNewsData = []; // Lưu lại để dùng cho Modal
async function fetchNewsData() {
    try {
        const response = await fetch(`news_data.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Không thể tải dữ liệu');
        const data = await response.json();
        globalNewsData = data.news || [];
        renderDashboard(data);
    } catch (error) {
        document.getElementById('news-container').innerHTML = `<div class="card"><p>Chưa có dữ liệu.</p></div>`;
    }
}

// 3. RENDER DASHBOARD & GẮN SỰ KIỆN CLICK
function renderDashboard(data) {
    const marketContainer = document.getElementById('market-container');
    if (data.market_data && data.market_data.length > 0) {
        let marketHTML = `<div class="card" style="display:flex; gap:16px; overflow-x:auto; padding:12px 20px;">`;
        data.market_data.forEach(item => {
            const isUp = item.trend === '↑' || item.trend === 'up';
            marketHTML += `
                <div style="min-width:120px; text-align:center;">
                    <strong style="display:block; font-size:14px;">${item.symbol}</strong>
                    <span style="color:${isUp ? '#00b050' : '#ff0000'}; font-weight:bold; display:flex; align-items:center; justify-content:center; gap:4px;">
                        ${item.price} <span class="material-icons-round" style="font-size:16px;">${isUp ? 'trending_up' : 'trending_down'}</span>
                    </span>
                </div>`;
        });
        marketContainer.innerHTML = marketHTML + `</div>`;
    }

    if (data.daily_briefing) {
        document.getElementById('briefing-container').innerHTML = `
            <div class="card" style="background-color: var(--md-sys-color-surface-variant); border: none;">
                <h3 class="card-title" style="display:flex; align-items:center; gap:8px;">
                    <span class="material-icons-round" style="color:var(--md-sys-color-primary)">smart_toy</span> AI Briefing
                </h3>
                <div class="card-summary" style="white-space: pre-wrap;">${data.daily_briefing}</div>
            </div>`;
    }

    const newsContainer = document.getElementById('news-container');
    if (globalNewsData.length > 0) {
        newsContainer.innerHTML = ''; // Xóa chữ Loading
        globalNewsData.forEach((cluster, index) => {
            const leadSource = cluster.sources && cluster.sources.length > 0 ? cluster.sources[0] : { source_name: 'Tổng hợp' };
            const timeObj = new Date(cluster.timestamp);
            const timeString = timeObj.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) + ' - ' + timeObj.toLocaleDateString('vi-VN');
            const hotBadge = (cluster.hot_score >= 20) ? '<span style="color:#e53935; margin-left:4px; font-size:11px;">🔥 HOT</span>' : '';

            // TẠO THẺ CARD CÓ THỂ CLICK
            const articleEl = document.createElement('article');
            articleEl.className = 'card';
            articleEl.style.cursor = 'pointer'; // Hiệu ứng bàn tay khi di chuột
            articleEl.innerHTML = `
                <span style="font-size:12px; font-weight:bold; color:var(--md-sys-color-primary); text-transform:uppercase;">CỤM SỰ KIỆN #${index + 1} ${hotBadge}</span>
                <h2 class="card-title" style="margin-top:8px;">${cluster.title}</h2>
                <p class="card-summary">${cluster.short_summary}</p>
                <div style="margin-top:16px; font-size:13px; opacity:0.7; display:flex; gap:16px;">
                    <span><span class="material-icons-round" style="font-size:14px; vertical-align:middle;">newspaper</span> ${leadSource.source_name}</span>
                    <span><span class="material-icons-round" style="font-size:14px; vertical-align:middle;">schedule</span> ${timeString}</span>
                </div>
            `;
            
            // Lắng nghe sự kiện click mở Modal
            articleEl.addEventListener('click', () => openModal(cluster));
            newsContainer.appendChild(articleEl);
        });
    }
}

// 4. QUẢN LÝ MODAL TÌNH BÁO
function initModalEvents() {
    const modal = document.getElementById('intelligence-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    
    if(closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if(modal) modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('active'); });
}

function openModal(cluster) {
    document.getElementById('modal-title').textContent = cluster.title;
    
    // Đổ dữ liệu AI Intelligence
    let bodyHtml = `<p style="margin-bottom:16px; line-height:1.6;">${cluster.detailed_summary || cluster.short_summary}</p>`;
    
    // Khối Tác động
    if (cluster.causes && cluster.causes.length > 0) {
        bodyHtml += `<div class="intelligence-box"><div class="intelligence-title"><span class="material-icons-round">troubleshoot</span> Nguyên nhân / Bối cảnh</div><ul>${cluster.causes.map(c => `<li>${c}</li>`).join('')}</ul></div>`;
    }
    if (cluster.effects && cluster.effects.length > 0) {
        bodyHtml += `<div class="intelligence-box"><div class="intelligence-title"><span class="material-icons-round">query_stats</span> Hệ quả & Tác động</div><ul>${cluster.effects.map(c => `<li>${c}</li>`).join('')}</ul></div>`;
    }
    if (cluster.follow_up) {
        bodyHtml += `<div class="intelligence-box" style="border-left-color:#e53935;"><div class="intelligence-title" style="color:#e53935;"><span class="material-icons-round">radar</span> Tiêu điểm cần theo dõi</div><p>${cluster.follow_up}</p></div>`;
    }

    document.getElementById('modal-body').innerHTML = bodyHtml;

    // Đổ danh sách nguồn báo dẫn
    const sourcesContainer = document.getElementById('modal-sources');
    sourcesContainer.innerHTML = '';
    if (cluster.sources) {
        cluster.sources.forEach(src => {
            sourcesContainer.innerHTML += `
                <a href="${src.url}" target="_blank" class="source-chip">
                    <img src="${src.source_logo || 'https://via.placeholder.com/16'}" width="16" height="16" style="border-radius:50%;"> 
                    ${src.source_name} <span class="material-icons-round" style="font-size:14px;">open_in_new</span>
                </a>`;
        });
    }

    document.getElementById('intelligence-modal').classList.add('active');
}

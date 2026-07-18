document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initModalEvents();
    renderSkeletons(); // Hiển thị khung xương tải trang ngay khi mở web
    fetchNewsData();   // Gọi API lấy dữ liệu
});

function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    const icon = btn.querySelector('.material-icons-round');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'light-theme') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        icon.textContent = 'dark_mode';
    }

    btn.addEventListener('click', () => {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.replace('dark-theme', 'light-theme');
            icon.textContent = 'dark_mode';
            localStorage.setItem('theme', 'light-theme');
        } else {
            document.body.classList.replace('light-theme', 'dark-theme');
            icon.textContent = 'light_mode';
            localStorage.setItem('theme', 'dark-theme');
        }
    });
}

function renderSkeletons() {
    const newsContainer = document.getElementById('news-container');
    let skeletons = '';
    for (let i = 0; i < 5; i++) {
        skeletons += `
            <div class="skeleton-card">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width: 80%;"></div>
            </div>`;
    }
    newsContainer.innerHTML = skeletons;
}

let globalNewsData = [];

async function fetchNewsData() {
    try {
        const response = await fetch(`news_data.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        globalNewsData = data.news || [];
        
        // Cập nhật thời gian
        const updateTimeEl = document.getElementById('last-update-time');
        if(data.stats && data.stats.last_run) {
            const d = new Date(data.stats.last_run);
            updateTimeEl.textContent = `Cập nhật: ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
        }

        renderStats(data);
        renderNewsFeed(globalNewsData);
        renderMarket(data.market_data || []);
        renderBriefing(data.daily_briefing);

    } catch (error) {
        document.getElementById('news-container').innerHTML = `<div class="news-card"><p>Lỗi kết nối. Không thể tải dữ liệu Intelligence.</p></div>`;
    }
}

function renderStats(data) {
    const statsContainer = document.getElementById('stats-container');
    const totalArticles = data.stats ? data.stats.total_crawled : 0;
    const totalTopics = globalNewsData.length;
    
    // Đếm số chủ đề có liên quan tới Kinh tế / Thị trường
    const marketTopics = globalNewsData.filter(t => 
        (t.categories && t.categories.includes('economy')) || 
        (t.market_impact && t.market_impact.length > 20)
    ).length;

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon blue"><span class="material-icons-round">language</span></div>
            <div class="stat-info"><h3>Sự kiện Toàn cảnh</h3><p>${totalTopics}</p></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon purple"><span class="material-icons-round">memory</span></div>
            <div class="stat-info"><h3>Báo cáo AI Xử lý</h3><p>${totalArticles}</p></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon orange"><span class="material-icons-round">trending_up</span></div>
            <div class="stat-info"><h3>Biến động Thị trường</h3><p>${marketTopics}</p></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon blue" style="background-color: rgba(16, 185, 129, 0.1); color: #10b981;"><span class="material-icons-round">check_circle</span></div>
            <div class="stat-info"><h3>Trạng thái Bot</h3><p style="font-size: 16px;">Sẵn sàng</p></div>
        </div>
    `;
}

function renderNewsFeed(newsData) {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = ''; 

    newsData.forEach(cluster => {
        const timeObj = new Date(cluster.timestamp);
        const timeString = `${timeObj.getHours().toString().padStart(2,'0')}:${timeObj.getMinutes().toString().padStart(2,'0')} - ${timeObj.toLocaleDateString('vi-VN')}`;
        const sourceCount = cluster.sources ? cluster.sources.length : 1;
        const mainRegion = (cluster.regions && cluster.regions.length > 0) ? cluster.regions[0] : 'Thế giới';

        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
            <div class="news-meta">
                <span class="news-tag">${mainRegion}</span>
                <span>${timeString}</span>
            </div>
            <h3>${cluster.title || cluster.cluster_title}</h3>
            <p>${cluster.short_summary}</p>
            <div class="news-footer">
                <span class="material-icons-round" style="font-size: 14px;">dynamic_feed</span> ${sourceCount} nguồn báo chí đưa tin
            </div>
        `;
        card.addEventListener('click', () => openModal(cluster));
        newsContainer.appendChild(card);
    });
}

function renderMarket(marketData) {
    const marketContainer = document.getElementById('market-container');
    if (marketData.length === 0) {
        marketContainer.innerHTML = '<p>Đang chờ dữ liệu thị trường...</p>';
        return;
    }
    
    let html = '';
    marketData.forEach(item => {
        const isUp = item.trend === '↑' || item.trend === 'up';
        const color = isUp ? '#10b981' : '#ef4444'; // Xanh lá ngọc mượt / Đỏ mượt
        const icon = isUp ? 'trending_up' : 'trending_down';

        html += `
            <div class="market-row">
                <strong>${item.symbol}</strong>
                <span style="color: ${color}; font-weight: bold; display: flex; align-items: center; gap: 4px;">
                    ${item.price} <span class="material-icons-round" style="font-size: 16px;">${icon}</span>
                </span>
            </div>`;
    });
    marketContainer.innerHTML = html;
}

function renderBriefing(briefingText) {
    const briefingContainer = document.getElementById('briefing-container');
    if (briefingText) {
        briefingContainer.innerHTML = `<p style="white-space: pre-wrap;">${briefingText}</p>`;
    } else {
        briefingContainer.innerHTML = '<p>Chưa có bản tin tóm tắt cho chu kỳ này.</p>';
    }
}

function initModalEvents() {
    const modal = document.getElementById('intelligence-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    if(closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if(modal) modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('active'); });
}

function openModal(cluster) {
    document.getElementById('modal-title').textContent = cluster.title || cluster.cluster_title;
    
    let bodyHtml = `<p style="margin-bottom:20px; font-size: 16px;">${cluster.detailed_summary || cluster.short_summary}</p>`;
    
    if (cluster.causes && cluster.causes.length > 0 && cluster.causes[0] !== "Đang cập nhật dữ liệu bối cảnh") {
        bodyHtml += `<div class="intelligence-box"><div class="intelligence-title"><span class="material-icons-round">troubleshoot</span> Căn nguyên / Bối cảnh</div><ul style="padding-left: 20px;">${cluster.causes.map(c => `<li style="margin-bottom:4px;">${c}</li>`).join('')}</ul></div>`;
    }
    
    if (cluster.effects && cluster.effects.length > 0 && cluster.effects[0] !== "Đang phân tích chuỗi hệ quả") {
        bodyHtml += `<div class="intelligence-box"><div class="intelligence-title"><span class="material-icons-round">query_stats</span> Tác động & Hệ quả</div><ul style="padding-left: 20px;">${cluster.effects.map(c => `<li style="margin-bottom:4px;">${c}</li>`).join('')}</ul></div>`;
    }
    
    if (cluster.follow_up) {
        bodyHtml += `<div class="intelligence-box" style="border-left-color: #f59e0b; background-color: rgba(245, 158, 11, 0.05);"><div class="intelligence-title" style="color: #f59e0b;"><span class="material-icons-round">radar</span> Insight: Điểm cần theo dõi</div><p>${cluster.follow_up}</p></div>`;
    }

    document.getElementById('modal-body').innerHTML = bodyHtml;

    const sourcesContainer = document.getElementById('modal-sources');
    sourcesContainer.innerHTML = '';
    if (cluster.sources) {
        cluster.sources.forEach(src => {
            sourcesContainer.innerHTML += `
                <a href="${src.url}" target="_blank" class="source-chip">
                    <img src="${src.source_logo || 'https://via.placeholder.com/16'}" width="16" height="16" style="border-radius:50%; object-fit: cover;"> 
                    ${src.source_name}
                </a>`;
        });
    }

    document.getElementById('intelligence-modal').classList.add('active');
}

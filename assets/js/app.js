let globalNewsData = [];
let totalCrawledArticles = 0;

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initModalEvents();
    initAdminEasterEgg();
    initSearch();
    renderSkeletons();
    fetchNewsData();
});

// 1. MENU RESPONSIVE CHO MOBILE
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuBtn && sidebar && overlay) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
}

// 2. TÌM KIẾM THỜI GIAN THỰC
function initSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        if (!term) {
            renderNewsFeed(globalNewsData); 
            return;
        }
        
        const filtered = globalNewsData.filter(cluster => {
            const title = (cluster.title || cluster.cluster_title || '').toLowerCase();
            const summary = (cluster.short_summary || '').toLowerCase();
            return title.includes(term) || summary.includes(term);
        });
        
        renderNewsFeed(filtered);
    });
}

// 3. ADMIN BẨN (BẤM LOGO 5 LẦN)
function initAdminEasterEgg() {
    const logo = document.querySelector('.logo');
    let clickCount = 0;
    let clickTimer;

    logo.addEventListener('click', () => {
        clickCount++;
        clearTimeout(clickTimer);
        
        if (clickCount === 5) {
            document.getElementById('admin-raw-count').textContent = totalCrawledArticles;
            document.getElementById('admin-topic-count').textContent = globalNewsData.length;
            document.getElementById('admin-modal').classList.add('active');
            clickCount = 0; 
        } else {
            clickTimer = setTimeout(() => { clickCount = 0; }, 1200);
        }
    });

    document.querySelector('.close-admin-action').addEventListener('click', () => {
        document.getElementById('admin-modal').classList.remove('active');
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

async function fetchNewsData() {
    try {
        const response = await fetch(`news_data.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        
        globalNewsData = data.news || [];
        totalCrawledArticles = data.stats ? data.stats.total_crawled : 0;
        
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
    const marketTopics = globalNewsData.filter(t => 
        (t.categories && t.categories.includes('economy')) || 
        (t.market_impact && t.market_impact.length > 20)
    ).length;

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon blue"><span class="material-icons-round">language</span></div>
            <div class="stat-info"><h3>Sự kiện Toàn cảnh</h3><p>${globalNewsData.length}</p></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon purple"><span class="material-icons-round">memory</span></div>
            <div class="stat-info"><h3>Báo cáo AI Xử lý</h3><p>${totalCrawledArticles}</p></div>
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

    if(newsData.length === 0) {
        newsContainer.innerHTML = `<p style="padding: 20px; opacity: 0.7;">Không tìm thấy chủ đề nào phù hợp.</p>`;
        return;
    }

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
                <span class="material-icons-round" style="font-size: 15px; color: var(--md-sys-color-primary);">dynamic_feed</span> ${sourceCount} cơ quan báo chí xác nhận
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
        const color = isUp ? '#10b981' : '#ef4444'; 
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
    }
}

// 4. LOGIC MODAL & ẨN/HIỆN NGUỒN BÁO
function initModalEvents() {
    const modal = document.getElementById('intelligence-modal');
    
    document.querySelector('.close-modal-action').addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('active'); });

    const toggleBtn = document.getElementById('toggle-sources-btn');
    const sourcesDiv = document.getElementById('modal-sources');
    const toggleIcon = document.getElementById('toggle-sources-icon');
    const toggleText = document.getElementById('toggle-sources-text');

    toggleBtn.addEventListener('click', () => {
        if (sourcesDiv.style.display === 'none') {
            sourcesDiv.style.display = 'flex';
            toggleIcon.textContent = 'visibility_off';
            toggleText.textContent = 'Ẩn danh sách nguồn báo';
        } else {
            sourcesDiv.style.display = 'none';
            toggleIcon.textContent = 'visibility';
            toggleText.textContent = 'Xem danh sách các nguồn báo chí';
        }
    });
}

function openModal(cluster) {
    document.getElementById('modal-title').textContent = cluster.title || cluster.cluster_title;
    
    let bodyHtml = `<p style="margin-bottom:20px; font-size: 16px; line-height: 1.6;">${cluster.detailed_summary || cluster.short_summary}</p>`;
    
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
    sourcesContainer.style.display = 'none'; 
    document.getElementById('toggle-sources-icon').textContent = 'visibility';
    document.getElementById('toggle-sources-text').textContent = 'Xem danh sách các nguồn báo chí';

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

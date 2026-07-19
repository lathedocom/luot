let globalNewsData = [];
let totalCrawledArticles = 0;

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initNavigation(); 
    initMobileTabs(); 
    initMobileSearch(); 
    initModalEvents();
    initAdminEasterEgg();
    initSearch();
    initFilters(); // Đã thêm
    renderSkeletons();
    fetchNewsData();
});

function initNavigation() {
    const tabs = ['overview', 'briefing', 'market'];
    tabs.forEach(tab => {
        const navBtn = document.getElementById(`nav-${tab}`);
        if (navBtn) {
            navBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                
                document.getElementById(`view-${tab}`).style.display = 'block';
                navBtn.classList.add('active');
                const sidebar = document.getElementById('app-sidebar');
                const overlay = document.getElementById('sidebar-overlay');
                if (sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            });
        }
    });
}

function initMobileTabs() {
    const btnNews = document.getElementById('tab-news');
    const btnSocial = document.getElementById('tab-social');
    const secFeed = document.getElementById('feed-section');
    const secSocial = document.getElementById('social-section');
    if(btnNews && btnSocial) {
        btnNews.addEventListener('click', () => {
            btnNews.classList.add('active');
            btnSocial.classList.remove('active');
            secFeed.style.display = 'block';
            secSocial.style.display = 'none';
        });
        btnSocial.addEventListener('click', () => {
            btnSocial.classList.add('active');
            btnNews.classList.remove('active');
            secFeed.style.display = 'none';
            secSocial.style.display = 'block';
        });
    }
    // Logic đảm bảo không bị lỗi UI khi chuyển đổi ngang dọc điện thoại
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            secFeed.style.display = 'block';
            secSocial.style.display = 'block';
        } else {
            if(btnNews && btnNews.classList.contains('active')) {
                secFeed.style.display = 'block';
                secSocial.style.display = 'none';
            } else {
                secFeed.style.display = 'none';
                secSocial.style.display = 'block';
            }
        }
    });
}

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

// ==========================================================
// CÁC HÀM XỬ LÝ TÌM KIẾM ĐÃ ĐƯỢC NÂNG CẤP
// ==========================================================
// 1. Hàm hỗ trợ: Ép hiển thị kết quả mà KHÔNG làm tụt bàn phím ảo
function forceShowNewsFeed() {
    // Ép về tab Tổng quan (nếu đang ở tab khác)
    const overviewBtn = document.getElementById('nav-overview');
    if (overviewBtn && !overviewBtn.classList.contains('active')) {
        document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById('view-overview').style.display = 'block';
        overviewBtn.classList.add('active');
    }
    // Ép hiển thị cột Tin tức trên Mobile (để tránh lỗi đang xem MXH thì không thấy kết quả)
    const btnNews = document.getElementById('tab-news');
    const btnSocial = document.getElementById('tab-social');
    const secFeed = document.getElementById('feed-section');
    const secSocial = document.getElementById('social-section');
    if (window.innerWidth <= 768 && btnNews && secFeed) {
        btnNews.classList.add('active');
        if (btnSocial) btnSocial.classList.remove('active');
        secFeed.style.display = 'block';
        if (secSocial) secSocial.style.display = 'none';
    }
}

// 2. Logic Tìm kiếm (Gõ phím thời gian thực)
function initSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        
        if (!term) {
            renderNewsFeed(globalNewsData);
        } else {
            const filtered = globalNewsData.filter(cluster => {
                const title = (cluster.title || cluster.cluster_title || '').toLowerCase();
                const summary = (cluster.short_summary || '').toLowerCase();
                return title.includes(term) || summary.includes(term);
            });
            renderNewsFeed(filtered);
        }
        
        // Gọi hàm xử lý UI ngầm định thay vì dùng .click()
        forceShowNewsFeed();
    });
}

// 3. Xử lý nút ẩn/hiện thanh tìm kiếm trên Mobile
function initMobileSearch() {
    const searchBtn = document.getElementById('mobile-search-btn');
    const searchBox = document.getElementById('header-search-box');
    const searchInput = document.getElementById('search-input');
    
    if(searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            searchBox.classList.toggle('active');
            
            if(searchBox.classList.contains('active')) {
                // Thêm độ trễ 50ms để CSS bung khung ra xong mới gọi bàn phím ảo (chống giật lag)
                setTimeout(() => searchInput.focus(), 50); 
            } else {
                searchInput.blur();
                searchInput.value = ''; // Tự động xóa chữ nếu đóng thanh tìm kiếm
                renderNewsFeed(globalNewsData); // Trả lại toàn bộ tin tức
            }
        });
    }
    
    // Tự động đóng tìm kiếm khi chạm ngón tay ra ngoài vùng trống
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && searchBox.classList.contains('active')) {
            // Sửa logic so sánh nút search an toàn tuyệt đối
            if (!searchBox.contains(e.target) && !searchBtn.contains(e.target)) {
                searchBox.classList.remove('active');
                searchInput.blur(); 
            }
        }
    });
}

function initAdminEasterEgg() {
    const logos = document.querySelectorAll('.logo');
    let clickCount = 0;
    let clickTimer;
    logos.forEach(logo => {
        logo.addEventListener('click', () => {
            clickCount++;
            clearTimeout(clickTimer);
            if (clickCount === 5) {
                // 1. Tính toán dữ liệu thị trường
                const marketTopics = globalNewsData.filter(t => 
                    (t.categories && t.categories.includes('economy')) || 
                    (t.market_impact && t.market_impact.length > 20)
                ).length;
                // 2. Chèn 4 thẻ thống kê vào bảng System Stats (Admin Modal)
                const adminModal = document.getElementById('admin-modal');
                let modalBody = adminModal.querySelector('.modal-body');
                
                // Tránh ghi đè nếu adminModal không có modal-body 
                if (!modalBody) modalBody = adminModal;
                
                modalBody.innerHTML = `
                    <div class="section-header" style="margin-top: 10px; margin-bottom: 20px;">
                        <div class="section-title">System Stats</div>
                    </div>
                    <div class="stats-row">
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
                    </div>
                `;
                adminModal.classList.add('active');
                clickCount = 0; 
            } else {
                clickTimer = setTimeout(() => { clickCount = 0; }, 1200);
            }
        });
    });
    const closeAdminBtn = document.querySelector('.close-admin-action') || document.getElementById('close-admin-btn');
    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', () => {
            document.getElementById('admin-modal').classList.remove('active');
        });
    }
}

function initFilters() {
    const filterRegion = document.getElementById('filter-region');
    const filterCategory = document.getElementById('filter-category');
    
    if(!filterRegion || !filterCategory) return;

    const applyFilters = () => {
        const regionVal = filterRegion.value;
        const catVal = filterCategory.value;

        const filteredData = globalNewsData.filter(cluster => {
            let matchRegion = true;
            let matchCat = true;

            // Kiểm tra khu vực
            if (regionVal !== 'all') {
                const clusterRegions = cluster.regions || [];
                matchRegion = clusterRegions.includes(regionVal) || (clusterRegions.length > 0 && clusterRegions[0] === regionVal);
            }
            // Kiểm tra ngành
            if (catVal !== 'all') {
                const clusterCats = cluster.categories || [];
                matchCat = clusterCats.includes(catVal);
            }

            return matchRegion && matchCat;
        });

        renderNewsFeed(filteredData);
    };

    filterRegion.addEventListener('change', applyFilters);
    filterCategory.addEventListener('change', applyFilters);
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
        // Render dữ liệu (Bỏ renderStats)
        renderNewsFeed(globalNewsData);
        renderBriefing(data.daily_briefing);
        renderMarket(data.market_data || []);
        renderSocial(data.social || []); 
    } catch (error) {
        document.getElementById('news-container').innerHTML = `<div class="news-card"><p>Lỗi kết nối. Không thể tải dữ liệu Intelligence.</p></div>`;
    }
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

function renderBriefing(briefingText) {
    const briefingContainer = document.getElementById('briefing-container');
    if (briefingText) {
        briefingContainer.innerHTML = `<p style="white-space: pre-wrap; font-size: 15px;">${briefingText}</p>`;
    } else {
        briefingContainer.innerHTML = '<p style="opacity:0.7;">Chưa có bản tin tóm tắt cho chu kỳ này.</p>';
    }
}

function renderMarket(marketData) {
    const marketContainer = document.getElementById('market-container');
    if (marketData.length === 0) {
        marketContainer.innerHTML = '<p style="opacity:0.7;">Đang chờ dữ liệu thị trường...</p>';
        return;
    }
    let html = '';
    marketData.forEach(item => {
        const isUp = item.trend === '↑' || item.trend === 'up';
        const color = isUp ? '#10b981' : '#ef4444'; 
        const icon = isUp ? 'trending_up' : 'trending_down';
        html += `
            <div style="background: var(--md-sys-color-surface); padding: 20px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid var(--md-sys-color-outline); box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <strong style="font-size: 16px; margin-bottom: 8px; opacity: 0.8;">${item.symbol}</strong>
                <span style="color: ${color}; font-size: 22px; font-weight: bold; display: flex; align-items: center; gap: 4px;">
                    ${item.price} <span class="material-icons-round">${icon}</span>
                </span>
            </div>`;
    });
    marketContainer.innerHTML = html;
}

function renderSocial(socialData) {
    const container = document.getElementById('social-container');
    if (!socialData || socialData.length === 0) {
        container.innerHTML = '<p style="opacity: 0.7; font-size: 13px;">Chưa có dữ liệu thảo luận.</p>';
        return;
    }
    let html = '';
    socialData.forEach(item => {
        html += `
            <div style="padding: 16px 0; border-bottom: 1px dashed var(--md-sys-color-outline);">
                <div style="font-weight: bold; font-size: 15px; margin-bottom: 8px; color: var(--md-sys-color-primary);">#${item.keyword || 'Trending'}</div>
                <div style="font-size: 14px; opacity: 0.85; line-height: 1.5;">${item.summary || item.content || 'Thảo luận đang tăng cao...'}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function initModalEvents() {
    const modal = document.getElementById('intelligence-modal');
    const closeAction = document.querySelector('.close-modal-action');
    if(closeAction) {
        closeAction.addEventListener('click', () => modal.classList.remove('active'));
    }
    modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('active'); });
    const toggleBtn = document.getElementById('toggle-sources-btn');
    const sourcesDiv = document.getElementById('modal-sources');
    const toggleIcon = document.getElementById('toggle-sources-icon');
    const toggleText = document.getElementById('toggle-sources-text');
    if (toggleBtn) {
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
}

function openModal(cluster) {
    document.getElementById('modal-title').textContent = cluster.title || cluster.cluster_title;
    
    let bodyHtml = `<p style="margin-bottom:20px; font-size: 15px; line-height: 1.6;">${cluster.detailed_summary || cluster.short_summary}</p>`;
    
    // 1. BIỂU ĐỒ NGUYÊN NHÂN -> HỆ QUẢ (Giao diện mới)
    if (cluster.causes && cluster.causes.length > 0 && cluster.effects && cluster.effects.length > 0) {
        bodyHtml += `
        <div class="intelligence-box">
            <div class="intelligence-title"><span class="material-icons-round">account_tree</span> Chuỗi Tác Động</div>
            <div class="cause-effect-flow">
                <div class="flow-node" style="border-color: #f59e0b;">${cluster.causes[0]}</div>
                <span class="material-icons-round flow-arrow">arrow_forward</span>
                <div class="flow-node" style="border-color: #ef4444;">${cluster.effects[0]}</div>
            </div>
        </div>`;
    }

    // 2. TIMELINE 24H (Kéo từ dữ liệu backend)
    if (cluster.timeline && cluster.timeline.length > 0) {
        let timelineHtml = `<div class="timeline-container">`;
        cluster.timeline.forEach(item => {
            const timeObj = new Date(item.timestamp);
            const timeStr = `${timeObj.getHours().toString().padStart(2,'0')}:${timeObj.getMinutes().toString().padStart(2,'0')} - ${timeObj.toLocaleDateString('vi-VN')}`;
            timelineHtml += `
                <div class="timeline-node">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <span class="timeline-time">${timeStr}</span>
                        ${item.title}
                    </div>
                </div>`;
        });
        timelineHtml += `</div>`;

        bodyHtml += `
        <div class="intelligence-box" style="background: transparent; border: none; padding: 0;">
            <div class="intelligence-title" style="color: var(--md-sys-color-primary);"><span class="material-icons-round">history</span> Diễn biến sự kiện</div>
            ${timelineHtml}
        </div>`;
    }

    // 3. INSIGHT: ĐIỀU CẦN THEO DÕI TẾP THEO
    if (cluster.follow_up) {
        bodyHtml += `
        <div class="intelligence-box" style="border-left-color: #f59e0b; background-color: rgba(245, 158, 11, 0.05); margin-top: 16px;">
            <div class="intelligence-title" style="color: #f59e0b;"><span class="material-icons-round">radar</span> Điều cần theo dõi tiếp theo</div>
            <p style="font-weight: 500; font-size: 14px;">${cluster.follow_up}</p>
        </div>`;
    }

    document.getElementById('modal-body').innerHTML = bodyHtml;
    
    // Xử lý các nguồn báo chí (giữ nguyên logic cũ)
    const sourcesContainer = document.getElementById('modal-sources');
    sourcesContainer.innerHTML = '';
    sourcesContainer.style.display = 'none'; 
    document.getElementById('toggle-sources-icon').textContent = 'visibility';
    document.getElementById('toggle-sources-text').textContent = 'Xem danh sách các nguồn báo chí';
    
    if (cluster.sources) {
        cluster.sources.forEach(src => {
            sourcesContainer.innerHTML += `
                <a href="${src.url}" target="_blank" class="source-chip">
                    <img src="${src.source_logo || 'https://via.placeholder.com/16'}" width="16" height="16" style="border-radius:50%; object-fit: cover; background: #fff;"> 
                    ${src.source_name}
                </a>`;
        });
    }
    document.getElementById('intelligence-modal').classList.add('active');
}

// ==========================================================================
// FILE: assets/js/main.js
// ==========================================================================
import { 
    fetchNewsData, 
    fetchTimelineData, 
    getGlobalNewsData, 
    getGlobalDigestData, 
    getTotalCrawledArticles 
} from './api.js';

import { 
    renderSkeletons, 
    renderNewsFeed, 
    renderDigestFeed 
} from './ui.js';

import { initModalEvents } from './modal.js';

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initNavigation(); 
    initMobileTabs(); 
    initMobileSearch(); 
    initModalEvents();
    initAdminEasterEgg();
    initSearch();
    initViewAllButton(); 
    renderSkeletons();
    fetchNewsData();
    fetchTimelineData();
});

function initNavigation() {
    const tabs = ['overview', 'briefing', 'timeline', 'market'];
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

function forceShowNewsFeed() {
    const overviewBtn = document.getElementById('nav-overview');
    if (overviewBtn && !overviewBtn.classList.contains('active')) {
        document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById('view-overview').style.display = 'block';
        overviewBtn.classList.add('active');
    }
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

function initViewAllButton() {
    const btn = document.getElementById('view-all-news-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const isViewingAll = btn.getAttribute('data-view-all') === 'true';
        
        if (!isViewingAll) {
            btn.setAttribute('data-view-all', 'true');
            btn.innerHTML = `Bản tin rút gọn <span class="material-icons-round" style="font-size: 16px;">unfold_less</span>`;
            // Lấy Global Data qua Getter thay vì đọc trực tiếp biến
            renderNewsFeed(getGlobalNewsData()); 
        } else {
            btn.setAttribute('data-view-all', 'false');
            btn.innerHTML = `Xem tất cả <span class="material-icons-round" style="font-size: 16px;">arrow_forward</span>`;
            renderDigestFeed(getGlobalDigestData());
        }
    });
}

function initSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        
        if (!term) {
            renderDigestFeed(getGlobalDigestData());
            const viewAllBtn = document.getElementById('view-all-news-btn');
            if (viewAllBtn) {
                viewAllBtn.setAttribute('data-view-all', 'false');
                viewAllBtn.innerHTML = `Xem tất cả <span class="material-icons-round" style="font-size: 16px;">arrow_forward</span>`;
            }
        } else {
            const filtered = getGlobalNewsData().filter(cluster => {
                const title = (cluster.title || cluster.cluster_title || '').toLowerCase();
                const summary = (cluster.short_summary || '').toLowerCase();
                return title.includes(term) || summary.includes(term);
            });
            renderNewsFeed(filtered); 
        }
        
        forceShowNewsFeed();
    });
}

function initMobileSearch() {
    const searchBtn = document.getElementById('mobile-search-btn');
    const searchBox = document.getElementById('header-search-box');
    const searchInput = document.getElementById('search-input');
    
    if(searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            searchBox.classList.toggle('active');
            
            if(searchBox.classList.contains('active')) {
                setTimeout(() => searchInput.focus(), 50); 
            } else {
                searchInput.blur();
                searchInput.value = ''; 
                renderDigestFeed(getGlobalDigestData());
                const viewAllBtn = document.getElementById('view-all-news-btn');
                if (viewAllBtn) {
                    viewAllBtn.setAttribute('data-view-all', 'false');
                    viewAllBtn.innerHTML = `Xem tất cả <span class="material-icons-round" style="font-size: 16px;">arrow_forward</span>`;
                }
            }
        });
    }
    
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && searchBox.classList.contains('active')) {
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
                // Lấy data mới nhất bằng Getters
                const currentNews = getGlobalNewsData();
                const currentTotal = getTotalCrawledArticles();

                const marketTopics = currentNews.filter(t => 
                    (t.categories && t.categories.includes('economy')) || 
                    (t.market_impact && t.market_impact.length > 20)
                ).length;
                
                const adminModal = document.getElementById('admin-modal');
                let modalBody = adminModal.querySelector('.modal-body');
                
                if (!modalBody) modalBody = adminModal;
                
                modalBody.innerHTML = `
                    <div class="section-header" style="margin-top: 10px; margin-bottom: 20px;">
                        <div class="section-title">System Stats</div>
                    </div>
                    <div class="stats-row">
                        <div class="stat-card">
                            <div class="stat-icon blue"><span class="material-icons-round">language</span></div>
                            <div class="stat-info"><h3>Sự kiện Toàn cảnh</h3><p>${currentNews.length}</p></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon purple"><span class="material-icons-round">memory</span></div>
                            <div class="stat-info"><h3>Báo cáo AI Xử lý</h3><p>${currentTotal}</p></div>
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

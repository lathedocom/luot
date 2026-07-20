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
    renderSkeletons();
    fetchNewsData();
});
 
function initNavigation() {
    // Thêm 'timeline' vào mảng
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
        
        // Đã thêm: Gọi hàm render trang Timeline
        renderTimelinePage(globalNewsData);
 
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
        const mainRegion = (cluster.regions && cluster.regions.length > 0) ? cluster.regions[0] : 'Thế giới';
 
        // ==========================================
        // XỬ LÝ CHÚ THÍCH NGUỒN MINH BẠCH (VẤN ĐỀ 2)
        // ==========================================
        const sources = cluster.sources || [];
        const sourceCount = sources.length; // Tổng số bài báo
        
        // Lọc danh sách các báo độc lập (dựa theo source_name, loại bỏ trùng lặp)
        const uniqueSourceNames = [...new Set(sources.map(s => s.source_name).filter(Boolean))];
        const uniqueCount = uniqueSourceNames.length; // Số lượng cơ quan báo chí
        
        let sourceFooterHtml = '';
        
        if (sourceCount === 0) {
            sourceFooterHtml = `<span class="material-icons-round" style="font-size: 15px; color: var(--md-sys-color-primary);">smart_toy</span> Tổng hợp bởi AI`;
        } 
        else if (uniqueCount === 1) {
            if (sourceCount > 1) {
                // Nhiều bài nhưng cùng 1 cơ quan
                sourceFooterHtml = `<span class="material-icons-round" style="font-size: 15px; color: var(--md-sys-color-primary);">dynamic_feed</span> Tổng hợp từ nhiều bài viết của cùng một cơ quan báo chí`;
            } else {
                // Chỉ có đúng 1 bài, 1 báo
                sourceFooterHtml = `<span class="material-icons-round" style="font-size: 15px; color: var(--md-sys-color-primary);">article</span> Nguồn: ${uniqueSourceNames[0]}`;
            }
        } 
        else {
            // Nhiều nguồn độc lập (Ví dụ: Nguồn: Reuters, BBC • Tổng hợp từ 3 nguồn)
            const topSources = uniqueSourceNames.slice(0, 2).join(', ');
            const hasMore = uniqueCount > 2 ? ', ...' : '';
            sourceFooterHtml = `<span class="material-icons-round" style="font-size: 15px; color: var(--md-sys-color-primary);">fact_check</span> Nguồn: ${topSources}${hasMore} • Đối chiếu từ ${uniqueCount} nguồn báo chí`;
        }
 
        // Tạo thẻ bài viết
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
                ${sourceFooterHtml}
            </div>
        `;
        
        // Gắn sự kiện click mở Modal
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
    try {
        // 1. Kiểm tra an toàn tiêu đề
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) modalTitle.textContent = cluster.title || cluster.cluster_title || 'Chi tiết sự kiện';
        
        let bodyHtml = `<p style="margin-bottom:20px; font-size: 15px; line-height: 1.6;">${cluster.detailed_summary || cluster.short_summary || ''}</p>`;
        
        // Hàm hỗ trợ vẽ danh sách an toàn (chống lỗi nếu dữ liệu là String thay vì Array)
        const renderList = (data) => {
            if (!data) return '';
            if (Array.isArray(data)) {
                return data.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('');
            }
            return `<li style="margin-bottom: 8px;">${data}</li>`; // Nếu là chuỗi, bọc vào 1 thẻ li
        };
 
        // 2. CĂN NGUYÊN / BỐI CẢNH
        if (cluster.causes && (Array.isArray(cluster.causes) ? cluster.causes.length > 0 : true)) {
            bodyHtml += `
            <div class="intelligence-box" style="margin-top: 16px; background: rgba(245, 158, 11, 0.05); border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px;">
                <div class="intelligence-title" style="color: #f59e0b; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 18px;">explore</span> Căn nguyên / Bối cảnh
                </div>
                <ul style="padding-left: 20px; font-size: 14px; margin-top: 12px; margin-bottom: 0; line-height: 1.6;">
                    ${renderList(cluster.causes)}
                </ul>
            </div>`;
        }
 
        // 3. TÁC ĐỘNG / ẢNH HƯỞNG CHUNG
        if (cluster.effects && (Array.isArray(cluster.effects) ? cluster.effects.length > 0 : true)) {
            bodyHtml += `
            <div class="intelligence-box" style="margin-top: 16px; background: rgba(239, 68, 68, 0.05); border-left: 4px solid #ef4444; padding: 12px; border-radius: 4px;">
                <div class="intelligence-title" style="color: #ef4444; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 18px;">bolt</span> Tác động / Ảnh hưởng
                </div>
                <ul style="padding-left: 20px; font-size: 14px; margin-top: 12px; margin-bottom: 0; line-height: 1.6;">
                    ${renderList(cluster.effects)}
                </ul>
            </div>`;
        }
 
        // 4. NHÓM BỊ ẢNH HƯỞNG (AFFECTED GROUPS - Màu Tím)
        if (cluster.affected_groups && (Array.isArray(cluster.affected_groups) ? cluster.affected_groups.length > 0 : true)) {
            bodyHtml += `
            <div class="intelligence-box" style="margin-top: 16px; background: rgba(139, 92, 246, 0.05); border-left: 4px solid #8b5cf6; padding: 12px; border-radius: 4px;">
                <div class="intelligence-title" style="color: #8b5cf6; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 18px;">groups</span> Đối tượng / Nhóm bị ảnh hưởng
                </div>
                <ul style="padding-left: 20px; font-size: 14px; margin-top: 12px; margin-bottom: 0; line-height: 1.6;">
                    ${renderList(cluster.affected_groups)}
                </ul>
            </div>`;
        }
 
        // 5. TÁC ĐỘNG THỊ TRƯỜNG (MARKET IMPACT - Màu Xanh lá)
        if (cluster.market_impact && (Array.isArray(cluster.market_impact) ? cluster.market_impact.length > 0 : true)) {
            bodyHtml += `
            <div class="intelligence-box" style="margin-top: 16px; background: rgba(16, 185, 129, 0.05); border-left: 4px solid #10b981; padding: 12px; border-radius: 4px;">
                <div class="intelligence-title" style="color: #10b981; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 18px;">trending_up</span> Tác động thị trường
                </div>
                <ul style="padding-left: 20px; font-size: 14px; margin-top: 12px; margin-bottom: 0; line-height: 1.6;">
                    ${renderList(cluster.market_impact)}
                </ul>
            </div>`;
        }
 
        // 6. INSIGHT: ĐIỀU CẦN THEO DÕI TIẾP THEO
        if (cluster.follow_up) {
            bodyHtml += `
            <div class="intelligence-box" style="margin-top: 20px; background: rgba(59, 130, 246, 0.05); border-left: 4px solid #3b82f6; padding: 12px; border-radius: 4px;">
                <div class="intelligence-title" style="color: #3b82f6; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                    <span class="material-icons-round" style="font-size: 18px;">radar</span> Điều cần theo dõi tiếp theo
                </div>
                <p style="font-weight: 500; font-size: 14px; margin-top: 8px; margin-bottom: 0; line-height: 1.6;">${cluster.follow_up}</p>
            </div>`;
        }
 
        const modalBody = document.getElementById('modal-body');
        if (modalBody) modalBody.innerHTML = bodyHtml;
        
        // 7. XỬ LÝ NGUỒN BÁO CHÍ (Phòng hờ lỗi HTML thiếu ID)
        const sourcesContainer = document.getElementById('modal-sources');
        if (sourcesContainer) {
            sourcesContainer.innerHTML = '';
            sourcesContainer.style.display = 'none'; 
            
            if (cluster.sources && Array.isArray(cluster.sources) && cluster.sources.length > 0) {
                cluster.sources.forEach(src => {
                    sourcesContainer.innerHTML += `
                        <a href="${src.url || '#'}" target="_blank" class="source-chip" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline); border-radius: 16px; font-size: 12px; text-decoration: none; color: inherit; margin-right: 8px; margin-bottom: 8px;">
                            <img src="${src.source_logo || 'https://via.placeholder.com/16'}" width="16" height="16" style="border-radius:50%; object-fit: cover; background: #fff;"> 
                            ${src.source_name || 'Nguồn báo'}
                        </a>`;
                });
            }
        }
 
        const toggleIcon = document.getElementById('toggle-sources-icon');
        if (toggleIcon) toggleIcon.textContent = 'visibility';
        
        const toggleText = document.getElementById('toggle-sources-text');
        if (toggleText) toggleText.textContent = 'Xem danh sách các nguồn báo chí';
        
        // 8. HIỂN THỊ MODAL
        const modal = document.getElementById('intelligence-modal');
        if (modal) {
            modal.classList.add('active');
        } else {
            console.error("Không tìm thấy ID 'intelligence-modal' trong giao diện.");
        }
 
    } catch (error) {
        console.error("Đã xảy ra lỗi khi render Modal:", error);
    }
}

// ==========================================
// THÊM MỚI: HÀM RENDER TRANG TIMELINE 
// ==========================================
async function fetchTimelineData() {
    try {
        const response = await fetch(`timeline_data.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        renderTimelinePage(data.stories || []);
    } catch (error) {
        document.getElementById('timeline-page-container').innerHTML = `<p>Lỗi tải Timeline.</p>`;
    }
}

function renderTimelinePage(stories) {
    const container = document.getElementById('timeline-page-container');
    if (!container) return;

    // Lọc các Story có từ 2 diễn biến trở lên
    const validStories = stories.filter(story => story.timeline && story.timeline.length > 1);
    validStories.sort((a, b) => b.last_updated - a.last_updated);

    if (validStories.length === 0) {
        container.innerHTML = '<p style="padding: 20px; opacity: 0.7;">Chưa có chuỗi sự kiện nào đủ dài để hiển thị.</p>';
        return;
    }

    let html = '';
    validStories.forEach(story => {
        let timelineNodes = '';
        
        story.timeline.forEach((item, index) => {
            const timeObj = new Date(item.time);
            const timeStr = `${timeObj.getHours().toString().padStart(2,'0')}:${timeObj.getMinutes().toString().padStart(2,'0')} - ${timeObj.toLocaleDateString('vi-VN')}`;
            
            timelineNodes += `
                <div style="display: flex; gap: 16px; margin-bottom: 16px; position: relative;">
                    ${index !== story.timeline.length - 1 ? '<div style="position: absolute; left: 5px; top: 20px; bottom: -20px; width: 2px; background: var(--md-sys-color-outline);"></div>' : ''}
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--md-sys-color-primary); margin-top: 5px; position: relative; z-index: 2; flex-shrink: 0;"></div>
                    <div>
                        <div style="font-size: 12px; color: var(--md-sys-color-primary); font-weight: bold; margin-bottom: 4px;">${timeStr}</div>
                        <div style="font-size: 14px; line-height: 1.5; font-weight: 500;">
                            ${item.title}
                        </div>
                        <div style="font-size: 13px; opacity: 0.7; margin-top: 4px;">${item.summary}</div>
                    </div>
                </div>
            `;
        });

        html += `
            <div class="widget" style="margin-bottom: 24px; border-left: 4px solid var(--md-sys-color-primary);">
                <div class="news-meta" style="margin-bottom: 12px;">
                    <span class="news-tag" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                        ${story.status === 'ongoing' ? 'Đang tiếp diễn' : 'Đã kết thúc'}
                    </span>
                </div>
                <h3 style="margin-bottom: 12px; font-size: 18px; line-height: 1.4;">${story.title}</h3>
                
                <div style="background: rgba(0,0,0,0.1); padding: 16px; border-radius: 8px; border: 1px solid var(--md-sys-color-outline); margin-top: 20px;">
                    ${timelineNodes}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Gọi fetchTimelineData() song song với fetchNewsData() ở sự kiện DOMContentLoaded

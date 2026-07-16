document.addEventListener('DOMContentLoaded', () => {
    let globalNewsData = []; // Lưu trữ để phục vụ thanh tìm kiếm

    // --- 1. GIAO DIỆN SÁNG/TỐI THEO HỆ ĐIỀU HÀNH ---
    const themeToggle = document.getElementById('theme-toggle');
    const htmlTag = document.documentElement;
    const icon = themeToggle.querySelector('.material-icons');
    
    // Kiểm tra xem hệ điều hành đang dùng dark hay light mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    // Ưu tiên lựa chọn cũ của user, nếu chưa chọn thì theo hệ thống
    if (savedTheme) { 
        htmlTag.setAttribute('data-theme', savedTheme); 
        icon.textContent = savedTheme === 'dark' ? 'light_mode' : 'dark_mode';
    } else if (prefersDark) { 
        htmlTag.setAttribute('data-theme', 'dark'); 
        icon.textContent = 'light_mode';
    }

    themeToggle.addEventListener('click', () => {
        const current = htmlTag.getAttribute('data-theme') || (prefersDark ? 'dark' : 'light');
        const newTheme = current === 'light' ? 'dark' : 'light';
        htmlTag.setAttribute('data-theme', newTheme);
        icon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
        localStorage.setItem('theme', newTheme);
    });

   // --- 2. TỰ ĐỘNG TẠO DANH SÁCH 7 NGÀY QUA ---
    const daysList = document.getElementById('dynamic-days-list');
    if (daysList) {
        daysList.innerHTML = ''; // Xóa trắng trước khi đổ data
        for(let i = 0; i < 7; i++) {
            let d = new Date();
            d.setDate(d.getDate() - i);
            let dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
            
            let label = "";
            if (i === 0) label = "Hôm nay";
            else if (i === 1) label = "Hôm qua";
            else label = `${i} ngày trước`;

            daysList.innerHTML += `<li><label><input type="checkbox" checked> ${label} (${dateStr})</label></li>`;
        }
    }

    // --- 3. TẢI DỮ LIỆU & TÌM KIẾM ---
    async function loadData() {
        try {
            const response = await fetch('./news_data.json');
            if (!response.ok) throw new Error("Chưa có file dữ liệu");
            const data = await response.json();
            globalNewsData = data.news; // Lưu lại
            renderNewsFeed(globalNewsData);
        } catch (error) { 
            console.log("Lỗi tải dữ liệu. Hãy đợi Bot chạy xong lần 1:", error);
            document.getElementById('news-feed').innerHTML = '<div class="card"><p>Chưa có dữ liệu tin tức. Vui lòng chờ AI tổng hợp.</p></div>';
        }
    }

    const searchInput = document.getElementById('search-input');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase();
            const filtered = globalNewsData.filter(n => 
                n.cluster_title.toLowerCase().includes(keyword) || 
                n.short_summary.toLowerCase().includes(keyword)
            );
            renderNewsFeed(filtered);
        });
    }

    // --- 4. ĐỔ DỮ LIỆU CÓ ẢNH MINH HỌA ---
    function renderNewsFeed(newsArray) {
        const feedContainer = document.getElementById('news-feed');
        feedContainer.innerHTML = '';
        
        if(newsArray.length === 0) {
            feedContainer.innerHTML = '<p>Không tìm thấy bản tin nào.</p>';
            return;
        }

        const sortedNews = newsArray.sort((a, b) => {
            const aScore = (a.expert_analysis ? 2 : 0) + (a.sources ? a.sources.length : 0);
            const bScore = (b.expert_analysis ? 2 : 0) + (b.sources ? b.sources.length : 0);
            return bScore - aScore;
        });

        sortedNews.forEach(news => {
            const isHot = news.sources && news.sources.length >= 3;
            const card = document.createElement('div');
            card.className = 'card news-card';
            
            // Hiển thị ảnh minh họa (nếu AI bóc được), nếu không lấy logo báo đầu tiên
            const imageUrl = news.thumbnail || (news.sources && news.sources[0] ? news.sources[0].source_logo : '');
            const imageHtml = imageUrl ? `<img src="${imageUrl}" class="news-thumbnail" onerror="this.style.display='none'">` : '';

            card.innerHTML = `
                ${isHot ? '<span class="hot-badge">🔥 Hot Topic</span>' : ''}
                ${imageHtml}
                <h3>${news.cluster_title}</h3>
                <p>${news.short_summary}</p>
            `;
            card.addEventListener('click', () => openModal(news));
            feedContainer.appendChild(card);
        });
    }

    // --- 5. MODAL CHI TIẾT VÀ NÚT NGUỒN ---
    const modal = document.getElementById('news-modal');
    function openModal(newsData) {
        document.getElementById('modal-title').textContent = newsData.cluster_title;
        document.getElementById('modal-content').textContent = newsData.detailed_summary;

        const aiContainer = document.getElementById('ai-analysis-container');
        if (newsData.expert_analysis) {
            document.getElementById('ai-analysis-text').textContent = newsData.expert_analysis;
            aiContainer.classList.remove('hidden');
        } else { aiContainer.classList.add('hidden'); }

        const sourcesContainer = document.getElementById('modal-sources');
        sourcesContainer.innerHTML = '';
        if (newsData.sources) {
            newsData.sources.forEach(src => {
                const btn = document.createElement('a');
                btn.href = src.url || src.link || '#';   // Quét tìm link gốc an toàn
                btn.target = "_blank"; // Mở bài gốc trong Tab mới
                btn.className = 'source-btn';
                btn.innerHTML = `<img src="${src.source_logo || 'https://via.placeholder.com/20'}" alt=""> Xem gốc trên ${src.source_name} ↗`;
                sourcesContainer.appendChild(btn);
            });
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    const btnCloseModal = document.getElementById('close-modal-btn');
    if(btnCloseModal) {
        btnCloseModal.addEventListener('click', () => { modal.classList.remove('active'); document.body.style.overflow = ''; });
    }
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } });

    loadData();
});

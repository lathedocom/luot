document.addEventListener('DOMContentLoaded', () => {
    let globalNewsData = [];

    // Hàm chuyển đổi thời gian sang chuẩn: Giờ:Phút, Ngày/Tháng/Năm
    function formatTime(timestamp) {
        const d = new Date(timestamp);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${hours}:${minutes}, ${day}/${month}/${year}`;
    }

    // --- 1. KÍCH HOẠT MENU MOBILE ---
    const menuBtn = document.getElementById('menu-btn');
    const leftSidebar = document.getElementById('left-sidebar');
    if (menuBtn && leftSidebar) {
        menuBtn.addEventListener('click', () => leftSidebar.classList.toggle('active'));
    }

    // --- 2. TỰ ĐỘNG TẠO DANH SÁCH 7 NGÀY ---
    const daysList = document.getElementById('dynamic-days-list');
    if (daysList) {
        daysList.innerHTML = ''; 
        for(let i = 0; i < 7; i++) {
            let d = new Date();
            d.setDate(d.getDate() - i);
            let dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
            let label = i === 0 ? "Hôm nay" : i === 1 ? "Hôm qua" : `${i} ngày trước`;
            daysList.innerHTML += `<li><label><input type="checkbox" checked> ${label} (${dateStr})</label></li>`;
        }
    }

    // --- 3. TẢI DỮ LIỆU & TÌM KIẾM ---
    async function loadData() {
        try {
            const response = await fetch('./news_data.json');
            if (!response.ok) throw new Error("Chưa có dữ liệu");
            const data = await response.json();
            globalNewsData = data.news;
            renderNewsFeed(globalNewsData);
        } catch (error) { 
            document.getElementById('news-feed').innerHTML = '<div class="card"><p>Chưa có dữ liệu tin tức. Vui lòng chờ hệ thống AI tổng hợp.</p></div>';
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

    // --- 4. RENDER THẺ TIN TỨC ---
    function renderNewsFeed(newsArray) {
        const feedContainer = document.getElementById('news-feed');
        feedContainer.innerHTML = '';
        if(newsArray.length === 0) return feedContainer.innerHTML = '<p>Không tìm thấy bản tin nào.</p>';

        const sortedNews = newsArray.sort((a, b) => b.timestamp - a.timestamp); // Xếp tin mới nhất lên đầu

        sortedNews.forEach(news => {
            const isHot = news.sources && news.sources.length >= 3;
            const card = document.createElement('div');
            card.className = 'card news-card';
            
            const imageUrl = news.thumbnail || (news.sources && news.sources[0] ? news.sources[0].source_logo : '');
            const imageHtml = imageUrl ? `<img src="${imageUrl}" class="news-thumbnail" onerror="this.style.display='none'">` : '';
            const timeString = formatTime(news.timestamp);

            card.innerHTML = `
                ${isHot ? '<span class="hot-badge">🔥 Hot Topic</span>' : ''}
                ${imageHtml}
                <h3>${news.cluster_title}</h3>
                <div class="news-time"><span class="material-icons">schedule</span> Cập nhật: ${timeString}</div>
                <p>${news.short_summary}</p>
            `;
            card.addEventListener('click', () => openModal(news));
            feedContainer.appendChild(card);
        });
    }

   // --- 5. RENDER BÀI TỔNG HỢP (MODAL) ---
    const modal = document.getElementById('news-modal');
    function openModal(newsData) {
        document.getElementById('modal-title').textContent = newsData.cluster_title;
        document.getElementById('modal-time').innerHTML = `<span class="material-icons">schedule</span> Cập nhật lúc: ${formatTime(newsData.timestamp)}`;
        
        // Tách các đoạn văn bằng AI sinh ra (\n) và bọc chúng trong thẻ <p> để căn lề đẹp mắt
        const paragraphs = newsData.detailed_summary.split('\n').filter(p => p.trim() !== '');
        const formattedContent = paragraphs.map(p => `<p>${p}</p>`).join('');
        document.getElementById('modal-content').innerHTML = formattedContent;

        // Xử lý AI Analysis
        const aiContainer = document.getElementById('ai-analysis-container');
        if (newsData.expert_analysis) {
            document.getElementById('ai-analysis-text').textContent = newsData.expert_analysis;
            aiContainer.classList.remove('hidden');
        } else { 
            aiContainer.classList.add('hidden'); 
        }

        // Xử lý nút xem bài gốc
        const sourcesContainer = document.getElementById('modal-sources');
        sourcesContainer.innerHTML = '';
        if (newsData.sources) {
            newsData.sources.forEach(src => {
                const btn = document.createElement('a');
                btn.href = src.url || src.link || '#';
                btn.target = "_blank"; 
                btn.className = 'source-btn';
                btn.innerHTML = `<img src="${src.source_logo || 'https://via.placeholder.com/20'}" alt=""> ${src.source_name} ↗`;
                sourcesContainer.appendChild(btn);
            });
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
// Xử lý nút đóng Modal
    const btnCloseModal = document.getElementById('close-modal-btn');
    if(btnCloseModal) {
        btnCloseModal.addEventListener('click', () => { 
            modal.classList.remove('active'); 
            document.body.style.overflow = ''; 
        });
    }
    
    // Đóng Modal khi bấm ra ngoài khoảng đen
    modal.addEventListener('click', (e) => { 
        if (e.target === modal) { 
            modal.classList.remove('active'); 
            document.body.style.overflow = ''; 
        } 
    });

    // Lệnh quan trọng nhất: Kích hoạt tải dữ liệu khi vừa vào web
    loadData();
});

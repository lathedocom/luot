document.addEventListener('DOMContentLoaded', () => {
    // --- 1. XỬ LÝ GIAO DIỆN SÁNG/TỐI (DARK MODE) ---
    const themeToggle = document.getElementById('theme-toggle');
    const htmlTag = document.documentElement;
    const icon = themeToggle.querySelector('.material-icons');

    // Kiểm tra bộ nhớ tạm xem khách từng chọn màu gì
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlTag.setAttribute('data-theme', savedTheme);
    icon.textContent = savedTheme === 'dark' ? 'light_mode' : 'dark_mode';

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlTag.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlTag.setAttribute('data-theme', newTheme);
        icon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
        localStorage.setItem('theme', newTheme); // Lưu lại lựa chọn
    });


    // --- 2. TẢI DỮ LIỆU JSON TẠI LOCAL ---
    async function loadData() {
        try {
            // Đọc file json cùng thư mục
            const response = await fetch('./news_data.json');
            if (!response.ok) throw new Error("Chưa có file dữ liệu");
            const data = await response.json();
            
            renderNewsFeed(data.news);
            renderSocialFeed(data.social);
        } catch (error) {
            console.log("Lỗi tải dữ liệu. Hãy đợi Bot chạy xong lần 1:", error);
            document.getElementById('news-feed').innerHTML = '<div class="card"><p>Chưa có dữ liệu tin tức. Vui lòng chờ AI tổng hợp.</p></div>';
        }
    }

    // --- 3. ĐỔ DỮ LIỆU TIN TỨC RA MÀN HÌNH ---
    function renderNewsFeed(newsArray) {
        const feedContainer = document.getElementById('news-feed');
        feedContainer.innerHTML = '';

        // Thuật toán sắp xếp: Ưu tiên Hot Topic (có AI phân tích hoặc nhiều nguồn) lên trên cùng
        const sortedNews = newsArray.sort((a, b) => {
            const aScore = (a.expert_analysis ? 2 : 0) + (a.sources ? a.sources.length : 0);
            const bScore = (b.expert_analysis ? 2 : 0) + (b.sources ? b.sources.length : 0);
            return bScore - aScore; // Xếp giảm dần
        });

        sortedNews.forEach(news => {
            const isHot = news.sources && news.sources.length >= 3;
            const card = document.createElement('div');
            card.className = 'card news-card';
            card.innerHTML = `
                ${isHot ? '<span class="hot-badge">🔥 Hot Topic</span>' : ''}
                <h3>${news.cluster_title}</h3>
                <p>${news.short_summary}</p>
            `;
            
            // Lắng nghe sự kiện Click để mở chi tiết
            card.addEventListener('click', () => openModal(news));
            feedContainer.appendChild(card);
        });
    }

    // --- 4. ĐỔ DỮ LIỆU MẠNG XÃ HỘI ---
    function renderSocialFeed(socialArray) {
        const socialContainer = document.getElementById('social-feed');
        socialContainer.innerHTML = '';

        socialArray.forEach(soc => {
            const card = document.createElement('div');
            card.className = 'card social-card';
            card.innerHTML = `
                <div class="social-platform">${soc.platform} • ${soc.author}</div>
                ${soc.image_url ? `<img src="${soc.image_url}" alt="Social Image">` : ''}
                <p class="social-text">${soc.translated_text}</p>
            `;
            socialContainer.appendChild(card);
        });
    }

    // --- 5. LOGIC HIỂN THỊ MODAL CHI TIẾT ---
    const modal = document.getElementById('news-modal');
    const btnCloseModal = document.getElementById('close-modal-btn');

    function openModal(newsData) {
        document.getElementById('modal-title').textContent = newsData.cluster_title;
        document.getElementById('modal-content').textContent = newsData.detailed_summary;

        // Xử lý AI Analysis
        const aiContainer = document.getElementById('ai-analysis-container');
        if (newsData.expert_analysis) {
            document.getElementById('ai-analysis-text').textContent = newsData.expert_analysis;
            aiContainer.classList.remove('hidden');
        } else {
            aiContainer.classList.add('hidden');
        }

        // Xử lý danh sách Nguồn gốc
        const sourcesContainer = document.getElementById('modal-sources');
        sourcesContainer.innerHTML = '';
        if (newsData.sources) {
            newsData.sources.forEach(src => {
                const btn = document.createElement('a');
                btn.href = src.url;
                btn.target = "_blank"; // Mở tab mới
                btn.className = 'source-btn';
                btn.innerHTML = `<img src="${src.source_logo || 'https://via.placeholder.com/20'}" alt="logo"> ${src.source_name}`;
                sourcesContainer.appendChild(btn);
            });
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Chống cuộn trang nền bên dưới
    }

    // Đóng Modal
    btnCloseModal.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });
    // Bấm ra ngoài khoảng đen cũng đóng modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Khởi chạy lấy dữ liệu
    loadData();
});

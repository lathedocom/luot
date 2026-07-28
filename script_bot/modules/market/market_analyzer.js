// ==========================================================================
// FILE: script_bot/modules/market/market_analyzer.js
// ==========================================================================

function linkMarketWithNews(marketDataArray, currentTopics) {
    // 1. Lọc các chủ đề gần đây (trong vòng 48 giờ) để đảm bảo tính thời sự
    const recentTopics = currentTopics.filter(t => (Date.now() - (t.timestamp || Date.now())) < 48 * 60 * 60 * 1000);

    return marketDataArray.map(item => {
        const changeValue = Math.abs(item.raw_change);
        item.is_alert = false;
        item.context = null;

        // Chỉ phân tích tìm nguyên nhân nếu mức biến động vượt ngưỡng cảnh báo (threshold)
        if (changeValue >= item.threshold) {
            item.is_alert = true;
            
            let bestMatch = null;
            let highestScore = 0;

            recentTopics.forEach(topic => {
                let score = 0;
                
                const title = (topic.title || topic.cluster_title || '').toLowerCase();
                const summary = (topic.short_summary || '').toLowerCase();
                const details = (topic.detailed_summary || '').toLowerCase();
                const causesStr = (topic.causes || []).join(' ').toLowerCase();
                
                // Lớp 1: Phân tích Từ khóa (Sử dụng Regex để bắt ranh giới từ, tránh nhận vơ)
                let keywordMatched = false;
                item.keywords.forEach(kw => {
                    const lowerKw = kw.toLowerCase();
                    // Tạo regex bắt từ đứng độc lập (cách nhau bởi khoảng trắng hoặc dấu câu)
                    const regex = new RegExp(`(?:^|\\s|[.,!?"'()])${lowerKw}(?:$|\\s|[.,!?"'()])`, 'i');
                    
                    if (regex.test(title)) {
                        score += 15; // Điểm cực cao nếu từ khóa nằm ở tiêu đề
                        keywordMatched = true;
                    } else if (regex.test(summary) || regex.test(causesStr)) {
                        score += 5;  // Điểm trung bình nếu nằm ở phần tóm tắt/nguyên nhân
                        keywordMatched = true;
                    } else if (regex.test(details)) {
                        score += 2;  // Điểm thấp nếu chỉ nằm rải rác trong chi tiết
                        keywordMatched = true;
                    }
                });

                // Nếu có nhắc đến từ khóa, tiếp tục chấm điểm logic khu vực và chuyên mục
                if (keywordMatched) {
                    
                    // Lớp 2: Chấm điểm tương đồng Khu vực (Region)
                    if (topic.regions && item.region) {
                        if (topic.regions.includes(item.region)) {
                            score += 10; // Cùng khu vực (Ví dụ: VN-Index khớp tin Việt Nam)
                        } else if (item.region === 'global' && topic.scope === 'global') {
                            score += 8;  // Tin thế giới khớp với chỉ số toàn cầu
                        }
                    }

                    // Lớp 3: Chấm điểm tương đồng Danh mục (Category Mapping)
                    const catMapping = {
                        'currency': ['economy', 'finance', 'trade'],
                        'stock': ['finance', 'economy', 'business'],
                        'metal': ['economy', 'trade', 'finance', 'business'],
                        'energy': ['energy', 'economy', 'politics', 'military', 'environment'],
                        'agriculture': ['economy', 'trade', 'environment'],
                        'crypto': ['tech', 'finance']
                    };

                    if (topic.categories && catMapping[item.type]) {
                        const matchedCats = topic.categories.filter(c => catMapping[item.type].includes(c));
                        if (matchedCats.length > 0) {
                            score += matchedCats.length * 5; // Cộng 5 điểm cho mỗi category khớp
                        }
                    }
                }

                // Chọn ra Topic có điểm cao nhất (Tối thiểu phải đạt 5 điểm mới được coi là có căn cứ)
                if (score > highestScore && score >= 5) {
                    highestScore = score;
                    bestMatch = topic;
                }
            });

            // Nếu tìm thấy nguyên nhân phù hợp, gán vào context để hiển thị trên giao diện
            if (bestMatch) {
                item.context = {
                    event_title: bestMatch.title || bestMatch.cluster_title,
                    causes: bestMatch.causes ? bestMatch.causes.slice(0, 2) : [],
                    market_impact: bestMatch.market_impact || "Thị trường đang phản ứng với diễn biến này."
                };
            }
        }
        
        // Dọn dẹp các trường cấu hình rác để giảm dung lượng file JSON trước khi lưu
        delete item.api_source;
        delete item.api_symbol;
        delete item.raw_change;
        delete item.threshold;
        delete item.keywords;
        delete item.base_price; 

        return item;
    });
}

module.exports = { linkMarketWithNews };

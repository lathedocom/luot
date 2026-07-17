const nlp = require('compromise');

function processNLPForClusters(clusters) {
    if (!clusters || clusters.length === 0) return [];
    
    console.log(`Bước 4: Trích xuất Entity (Tên người, Tổ chức, Địa điểm) cho ${clusters.length} cụm sự kiện...`);
    
    const enhancedClusters = clusters.map(cluster => {
        // Đưa nội dung thô vào thư viện NLP để phân tích
        let doc = nlp(cluster.combined_text);
        
        // Nhặt ra các thực thể (entities)
        let places = doc.places().out('array');
        let people = doc.people().out('array');
        let organizations = doc.organizations().out('array');
        
        // Hàm phụ: Lọc bỏ các từ trùng lặp và quá ngắn (dưới 3 ký tự)
        const getUnique = (arr) => [...new Set(arr)].filter(item => item.trim().length > 2);
        
        // Gắn thêm dữ liệu vào cụm sự kiện
        return {
            ...cluster,
            entities: {
                places: getUnique(places),
                people: getUnique(people),
                organizations: getUnique(organizations)
            }
        };
    });

    console.log(`✅ Đã trích xuất xong Entity.`);
    return enhancedClusters;
}

module.exports = { processNLPForClusters };
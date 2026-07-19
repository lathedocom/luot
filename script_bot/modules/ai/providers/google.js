const BaseProvider = require('./base_provider');

class GoogleProvider extends BaseProvider {
    constructor(apiKey, modelName = 'gemini-3.1-flash-lite') {
        super(apiKey);
        this.modelName = modelName;
    }

    async generateContent(prompt, systemInstruction = "") {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (response.status === 429) throw new Error("RATE_LIMIT");
        if (!response.ok) throw new Error(`Google API Error: ${response.status}`);

        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        }
        throw new Error("Empty response from Google");
    }

    async embedContent(text, modelName = 'embedding-001') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: `models/${modelName}`,
                content: { parts: [{ text: text }] }
            })
        });

        if (!response.ok) {
            const errData = await response.text();
            throw new Error(`HTTP Lỗi ${response.status}: ${errData}`);
        }

        const data = await response.json();
        if (data.embedding && data.embedding.values) {
            return data.embedding.values;
        }
        throw new Error("Google trả về 200 OK nhưng thiếu dữ liệu vector.");
    }

    // === HÀM MỚI ĐƯỢC CHÈN ĐÚNG VỊ TRÍ (BÊN TRONG CLASS) ===
    async batchEmbedContents(texts, modelName = 'embedding-001') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:batchEmbedContents?key=${this.apiKey}`;
        
        // Đóng gói mảng text thành định dạng batch mà Google yêu cầu
        const requests = texts.map(text => ({
            model: `models/${modelName}`,
            content: { parts: [{ text: text }] }
        }));

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests })
        });

        if (!response.ok) {
            const errData = await response.text();
            throw new Error(`HTTP Lỗi ${response.status}: ${errData}`);
        }

        const data = await response.json();
        if (data.embeddings) {
            return data.embeddings.map(e => e.values);
        }
        throw new Error("Google trả về 200 OK nhưng thiếu dữ liệu vector batch.");
    }
} // => KẾT THÚC CLASS GOOGLE PROVIDER Ở ĐÂY

module.exports = GoogleProvider;

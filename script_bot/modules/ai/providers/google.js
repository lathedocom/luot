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

    // Đã thay thế thành gemini-embedding-2
    async embedContent(text, modelName = 'gemini-embedding-2') {
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

    // Đã thay thế thành gemini-embedding-2
    async batchEmbedContents(texts, modelName = 'gemini-embedding-2') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:batchEmbedContents?key=${this.apiKey}`;
        
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
            
            let availableModels = "";
            try {
                const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`;
                const listRes = await fetch(listUrl);
                const listData = await listRes.json();
                
                const embedModels = listData.models
                    .filter(m => m.name.includes('embed'))
                    .map(m => m.name.replace('models/', ''));
                    
                availableModels = `\n\n🎯 [AUTO-DEBUG] API Key của bạn không hỗ trợ '${modelName}'.\nDanh sách các Model Vector bạn CÓ QUYỀN sử dụng là: [ ${embedModels.join(', ')} ].\nHãy copy một tên trong danh sách này và thay thế vào code.`;
            } catch(e) {
                availableModels = `\n(Không thể tự động quét danh sách model do lỗi mạng phụ)`;
            }

            throw new Error(`HTTP Lỗi ${response.status}: ${errData}${availableModels}`);
        }

        const data = await response.json();
        if (data.embeddings) {
            return data.embeddings.map(e => e.values);
        }
        throw new Error("Google trả về 200 OK nhưng thiếu dữ liệu vector batch.");
    }
} 

module.exports = GoogleProvider;

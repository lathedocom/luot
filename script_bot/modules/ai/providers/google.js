const BaseProvider = require('./base_provider');

class GoogleProvider extends BaseProvider {
    constructor(apiKey, defaultModel = 'gemini-3.1-flash-lite') {
        super(apiKey);
        this.defaultModel = defaultModel;
    }

    async generateContent(prompt, systemInstruction = "", modelName = null) {
        const targetModel = modelName || this.defaultModel;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${this.apiKey}`;
        
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
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Google API Error ${response.status}: ${errText}`);
        }
        
        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        }
        throw new Error("Empty response from Google");
    }

    async embedContent(text, modelName = 'text-embedding-004') {
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

    async batchEmbedContents(texts, modelName = 'text-embedding-004') {
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
            throw new Error(`HTTP Lỗi ${response.status}: ${errData}`);
        }
        const data = await response.json();
        if (data.embeddings) {
            return data.embeddings.map(e => e.values);
        }
        throw new Error("Google trả về 200 OK nhưng thiếu dữ liệu vector batch.");
    }
} 
module.exports = GoogleProvider;

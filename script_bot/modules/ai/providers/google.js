// script_bot/modules/ai/providers/google.js
const BaseProvider = require('./base_provider');

// Bộ nhớ đệm lưu thời gian gọi cuối cùng của TỪNG MODEL để quản lý RPM
const lastCallTimes = {};

class GoogleProvider extends BaseProvider {
    constructor(apiKey, defaultModel = 'gemini-3.1-flash-lite') {
        super(apiKey);
        this.defaultModel = defaultModel;
    }

    // Hàm tiện ích tự động sleep để tránh lỗi 429 Too Many Requests
    async handleRateLimit(modelName) {
        let rpmLimit = 5; // Mặc định khắt khe nhất (5 RPM)
        
        if (modelName.includes('embedding')) rpmLimit = 100;
        else if (modelName.includes('gemma')) rpmLimit = 30;
        else if (modelName === 'gemini-3.1-flash-lite') rpmLimit = 15;
        else if (modelName === 'gemini-2.5-flash-lite') rpmLimit = 10;
        else rpmLimit = 5; // Cho 3-flash, 2.5-flash, 3.5-flash

        const minIntervalMs = (60000 / rpmLimit) + 100; // Cộng bù 100ms an toàn
        const now = Date.now();
        const lastCall = lastCallTimes[modelName] || 0;
        
        const timeSinceLastCall = now - lastCall;
        if (timeSinceLastCall < minIntervalMs) {
            const delay = minIntervalMs - timeSinceLastCall;
            await new Promise(res => setTimeout(res, delay));
        }
        lastCallTimes[modelName] = Date.now();
    }

    async generateContent(prompt, systemInstruction = "", modelName = null) {
        const targetModel = modelName || this.defaultModel;
        
        // Kiểm tra và tự động giãn cách lệnh gọi
        await this.handleRateLimit(targetModel);

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

    async embedContent(text, modelName = 'gemini-embedding-1') {
        await this.handleRateLimit(modelName);
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: `models/${modelName}`,
                content: { parts: [{ text: text }] }
            })
        });
        
        if (response.status === 429) throw new Error("RATE_LIMIT");
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

    async batchEmbedContents(texts, modelName = 'gemini-embedding-1') {
        await this.handleRateLimit(modelName);
        
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
        
        if (response.status === 429) throw new Error("RATE_LIMIT");
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

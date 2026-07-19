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

    async embedContent(text, modelName = 'text-embedding-004') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: { parts: [{ text: text }] },
                taskType: "CLUSTERING"
            })
        });

        const data = await response.json();
        if (data.embedding && data.embedding.values) {
            return data.embedding.values;
        }
        throw new Error("Failed to generate embedding from Google");
    }
}

module.exports = GoogleProvider;

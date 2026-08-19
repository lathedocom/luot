const BaseProvider = require('./base_provider');
const { Groq } = require('groq-sdk');

class GroqProvider extends BaseProvider {
    constructor(apiKey, modelName = 'openai/gpt-oss-20b') {
        super(apiKey);
        this.modelName = modelName;
        this.client = apiKey ? new Groq({ apiKey: apiKey }) : null;
    }

    async generateContent(prompt, systemInstruction = "", modelName = null) {
        if (!this.client) throw new Error("Groq API Key missing");
        const messages = [];
        if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
        messages.push({ role: "user", content: prompt });
        
        const response = await this.client.chat.completions.create({
            messages: messages,
            model: modelName || this.modelName, 
            temperature: 0.1,
            response_format: { type: "json_object" }
        });
        return response.choices[0].message.content;
    }

    async embedContent(text) {
        throw new Error("Groq currently does not support direct text embedding in this architecture.");
    }
}
module.exports = GroqProvider;

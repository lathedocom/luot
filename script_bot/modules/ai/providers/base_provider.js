/**
 * Interface chuẩn mực cho mọi AI Provider.
 * Các nhà cung cấp (Google, Groq, OpenAI...) đều phải tuân thủ cấu trúc này.
 */
class BaseProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    // Hàm gọi AI sinh text/json
    async generateContent(prompt, systemInstruction = "") {
        throw new Error("Method 'generateContent()' must be implemented.");
    }

    // Hàm gọi AI tạo vector (nếu Provider đó có hỗ trợ)
    async embedContent(text) {
        throw new Error("Method 'embedContent()' must be implemented.");
    }
}

module.exports = BaseProvider;

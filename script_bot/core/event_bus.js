const EventEmitter = require('events');

/**
 * Lớp kế thừa từ EventEmitter để cấu hình các tùy chỉnh riêng nếu cần.
 * Bật giới hạn số lượng Listener cao hơn mặc định (10) để tránh cảnh báo rò rỉ bộ nhớ.
 */
class EventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(30); 
    }
}

// Xuất ra một Singleton (dùng chung một instance cho toàn dự án)
const eventBus = new EventBus();

module.exports = eventBus;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeferredSet = void 0;
class DeferredSet {
    debounce_buffer = new Map();
    disable_buffer = new Set();
    debounce_seconds;
    disable_seconds;
    constructor(debounce_seconds, disable_seconds) {
        this.debounce_seconds = debounce_seconds * 1000;
        this.disable_seconds = disable_seconds * 1000;
    }
    set(id, action) {
        if (this.disable_buffer.has(id)) {
            return;
        }
        const timeout_id = this.debounce_buffer.get(id);
        if (timeout_id) {
            clearTimeout(timeout_id);
        }
        this.debounce_buffer.set(id, setTimeout(() => {
            action();
            this.debounce_buffer.delete(id);
            // disable similar actions
            if (this.disable_seconds > 0) {
                this.disable_buffer.add(id);
                setTimeout(() => {
                    this.disable_buffer.delete(id);
                }, this.disable_seconds);
            }
        }, this.debounce_seconds));
    }
}
exports.DeferredSet = DeferredSet;

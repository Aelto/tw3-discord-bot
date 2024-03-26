"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FifoQueue = void 0;
class FifoQueue {
    buffer;
    index;
    constructor(size) {
        this.buffer = new Array(size);
        this.index = 0;
    }
    insert(item) {
        this.buffer[this.index] = item;
        this.index = (this.index + 1) % this.buffer.length;
    }
    remove(item) {
        const some_index = this.buffer.findIndex((i) => i === item);
        if (some_index >= 0) {
            this.buffer[some_index] = undefined;
        }
    }
    all() {
        return this.buffer.filter((i) => i !== undefined);
    }
}
exports.FifoQueue = FifoQueue;

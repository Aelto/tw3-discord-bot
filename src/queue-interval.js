"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueInterval = void 0;
/**
 * A queue where you can push actions (promises) to run on an interval, to defer
 * the actions.
 */
class QueueInterval {
    delay;
    interval_id;
    queue;
    started;
    on_clear;
    constructor(delay = 500, on_clear = () => { }) {
        this.delay = delay;
        this.queue = [];
        this.interval_id = null;
        this.started = false;
        this.on_clear = on_clear;
    }
    push(promise) {
        return new Promise((resolve) => {
            this.queue.push(async () => {
                const result = await promise();
                resolve(result);
            });
            this.start();
        });
    }
    start() {
        if (this.queue.length > 0) {
            setTimeout(() => { }, this.delay);
            this.interval_id = setInterval(() => {
                if (this.queue.length <= 0) {
                    return this.stop();
                }
                const [action, ...rest] = this.queue;
                action();
                this.queue = rest;
            }, this.delay);
        }
        this.started = true;
        return this;
    }
    stop() {
        if (typeof this.interval_id === "number") {
            clearInterval(this.interval_id);
        }
        this.interval_id = null;
        this.on_clear();
    }
}
exports.QueueInterval = QueueInterval;

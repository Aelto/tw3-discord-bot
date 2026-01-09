"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RECENT_MESSAGES = exports.REPUTATION_CACHE = void 0;
const fifo_queue_1 = require("../../datatypes/fifo-queue");
class AntiSpamMessageCache {
    messages_by_author_id;
    last_cleanup = Date.now();
    cleanupAntispamMessages() {
        const now = Date.now();
        if (now - this.last_cleanup < 1000 * 60) {
            return;
        }
        this.last_cleanup = now;
        const keys = this.getMessageAuthorIdsInCache();
        const one_second = 1000;
        const one_minute = 60 * one_second;
        for (const key of keys) {
            const message = this.getMessageFromAuthorId(key);
            if (!message) {
                continue;
            }
            const delta = now - message.timestamp;
            if (delta > one_minute * 10) {
                this.messages_by_author_id.delete(key);
            }
        }
    }
    getMessageFromAuthorId(key) {
        return this.messages_by_author_id.get(key);
    }
    getMessageAuthorIdsInCache() {
        return this.messages_by_author_id.keys();
    }
    setMessageCache(author, message) {
        if (!this.isAuthorIdValid(author)) {
            return;
        }
        this.messages_by_author_id.set(author, message);
    }
    resetReputationByauthorId(author) {
        if (!this.isAuthorIdValid(author)) {
            return;
        }
        const message = this.getMessageFromAuthorId(author);
        if (message) {
            message.reputation = 10;
            this.setMessageCache(author, message);
        }
    }
    isAuthorIdValid(id) {
        return id.length > 0;
    }
}
exports.REPUTATION_CACHE = new AntiSpamMessageCache();
exports.RECENT_MESSAGES = new fifo_queue_1.FifoQueue(20);

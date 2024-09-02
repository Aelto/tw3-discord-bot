"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RECENT_MESSAGES = exports.ANTISPAM_MESSAGES = void 0;
exports.cleanupAntispamMessages = cleanupAntispamMessages;
exports.getAntispamMessageByAuthorId = getAntispamMessageByAuthorId;
const fifo_queue_1 = require("../../datatypes/fifo-queue");
/**
 * stores the last message posted by people with information about the message
 * itself, like its content and when it was posted.
 */
exports.ANTISPAM_MESSAGES = new Map();
exports.RECENT_MESSAGES = new fifo_queue_1.FifoQueue(20);
let last_cleanup = Date.now();
function cleanupAntispamMessages() {
    const now = Date.now();
    if (now - last_cleanup < 1000 * 60) {
        return;
    }
    const keys = exports.ANTISPAM_MESSAGES.keys();
    const one_second = 1000;
    const one_minute = 60 * one_second;
    for (const key of keys) {
        const message = exports.ANTISPAM_MESSAGES.get(key);
        if (!message) {
            continue;
        }
        const delta = now - message.timestamp;
        if (delta > one_minute * 10) {
            exports.ANTISPAM_MESSAGES.delete(key);
        }
    }
}
function getAntispamMessageByAuthorId(id) {
    return exports.ANTISPAM_MESSAGES.get(id) || null;
}

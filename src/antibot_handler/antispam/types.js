"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageToAntiSpamMessage = void 0;
function messageToAntiSpamMessage(message, reputation = 10) {
    return {
        content: message.content,
        timestamp: Date.now(),
        channel_id: message.channelId,
        reputation,
        tendency: 0,
    };
}
exports.messageToAntiSpamMessage = messageToAntiSpamMessage;

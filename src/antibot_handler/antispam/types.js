"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageToAntiSpamMessage = messageToAntiSpamMessage;
function messageToAntiSpamMessage(message, reputation = 10) {
    return {
        uuid: message.id,
        content: message.content,
        timestamp: Date.now(),
        channel_id: message.channelId,
        reputation,
        tendency: 0,
    };
}

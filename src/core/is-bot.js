"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBot = isBot;
function isBot(message) {
    return message.author.username.includes("Caretaker") || message.author.bot;
}

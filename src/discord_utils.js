"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guildMemberFromMessage = guildMemberFromMessage;
exports.deleteMessage = deleteMessage;
function guildMemberFromMessage(message) {
    return message.member || message.guild.members.cache.get(message.author.id);
}
async function deleteMessage(message) {
    if (message && message.deletable) {
        message.delete().catch(console.error);
    }
}

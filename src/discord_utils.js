"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guildMemberFromMessage = void 0;
function guildMemberFromMessage(message) {
    return message.member || message.guild.members.cache.get(message.author.id);
}
exports.guildMemberFromMessage = guildMemberFromMessage;

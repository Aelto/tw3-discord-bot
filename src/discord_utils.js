"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guildMemberFromMessage = guildMemberFromMessage;
function guildMemberFromMessage(message) {
    return message.member || message.guild.members.cache.get(message.author.id);
}

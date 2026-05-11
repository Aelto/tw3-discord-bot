import { GuildMember, Message } from "discord.js";

export function guildMemberFromMessage(message: Message): GuildMember {
  return message.member || message.guild.members.cache.get(message.author.id);
}

export async function deleteMessage(message: Message) {
  if (message && message.deletable) {
    message.delete().catch(console.error);
  }
}
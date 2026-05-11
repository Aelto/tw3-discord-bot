import { Message } from "discord.js";

export function isBot(message: Message): boolean {
  return message.author.username.includes("Caretaker") || message.author.bot;
}

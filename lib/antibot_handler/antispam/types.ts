import { Message } from "discord.js";

export interface AntispamMessage {
  uuid: string;

  channel_id: string;
  content: string;
  timestamp: number;

  /**
   * A number above 0 for good reputation, below 0 for bad reputation.
   *
   * A bad reputation usually result in the user being restricted to prevent
   * further spam.
   */
  reputation: number;

  /**
   * stores how much the reputation has changed compared to the previous message
   */
  tendency: number;
}

export function messageToAntiSpamMessage(
  message: Message,
  reputation: number = 10
): AntispamMessage {
  return {
    uuid: message.id,
    content: message.content,
    timestamp: Date.now(),
    channel_id: message.channelId,
    reputation,
    tendency: 0,
  };
}

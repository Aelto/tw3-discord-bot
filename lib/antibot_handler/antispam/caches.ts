import { Message } from "discord.js";
import { FifoQueue } from "../../datatypes/fifo-queue";
import { AntispamMessage } from "./types";

/**
 * stores the last message posted by people with information about the message
 * itself, like its content and when it was posted.
 */
export const ANTISPAM_MESSAGES: Map<Message["author"]["id"], AntispamMessage> =
  new Map();

export const RECENT_MESSAGES: FifoQueue<Message> = new FifoQueue(20);

let last_cleanup = Date.now();

export function cleanupAntispamMessages() {
  const now = Date.now();
  if (now - last_cleanup < 1000 * 60) {
    return;
  }

  const keys = ANTISPAM_MESSAGES.keys();
  const one_second = 1000;
  const one_minute = 60 * one_second;

  for (const key of keys) {
    const message = ANTISPAM_MESSAGES.get(key);

    if (!message) {
      continue;
    }

    const delta = now - message.timestamp;
    if (delta > one_minute * 10) {
      ANTISPAM_MESSAGES.delete(key);
    }
  }
}

export function getAntispamMessageByAuthorId(id: Message["author"]["id"]): AntispamMessage | null {
  return ANTISPAM_MESSAGES.get(id) || null;
}
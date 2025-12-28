import { Message } from "discord.js";
import { FifoQueue } from "../../datatypes/fifo-queue";
import { AntispamMessage } from "./types";

type CacheId = Message["author"]["id"];

class AntiSpamMessageCache {
  private messages_by_author_id: Map<CacheId, AntispamMessage>;

  private last_cleanup: number = Date.now();
  public cleanupAntispamMessages() {
    const now = Date.now();
    if (now - this.last_cleanup < 1000 * 60) {
      return;
    }

    this.last_cleanup = now;

    const keys = this.getMessageAuthorIdsInCache();
    const one_second = 1000;
    const one_minute = 60 * one_second;

    for (const key of keys) {
      const message = this.getMessageFromAuthorId(key);

      if (!message) {
        continue;
      }

      const delta = now - message.timestamp;
      if (delta > one_minute * 10) {
        this.messages_by_author_id.delete(key);
      }
    }
  }

  public getMessageFromAuthorId(key: CacheId): AntispamMessage | undefined {
    return this.messages_by_author_id.get(key);
  }

  public getMessageAuthorIdsInCache() {
    return this.messages_by_author_id.keys();
  }

  public setMessageCache(author: CacheId, message: AntispamMessage) {
    if (!this.isAuthorIdValid(author)) {
      return;
    }

    this.messages_by_author_id.set(author, message);
  }

  public resetReputationByauthorId(author: CacheId) {
    if (!this.isAuthorIdValid(author)) {
      return;
    }

    const message = this.getMessageFromAuthorId(author);

    if (message) {
      message.reputation = 10;
      this.setMessageCache(author, message);
    }
  }

  private isAuthorIdValid(id: CacheId): boolean {
    return id.length > 0;
  }
}

export const REPUTATION_CACHE = new AntiSpamMessageCache();
export const RECENT_MESSAGES: FifoQueue<Message> = new FifoQueue(20);

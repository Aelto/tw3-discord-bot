import { Client, GuildMember, Message } from "discord.js";
import {
  log_reputation,
  log_reputation_message_deleted,
  log_reputation_user_shutdown,
} from "./logging";
import { Jail } from "./jail";

const { BOT_ID, ADMIN_ROLE_ID, VERBOSE_BOT_ROLE } = require("../constants.js");

export interface AntispamMessage {
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

/**
 * stores the last message posted by people with information about the message
 * itself, like its content and when it was posted.
 */
const ANTISPAM_MESSAGES: Map<Message["author"]["id"], AntispamMessage> =
  new Map();

let last_cleanup = Date.now();

export async function antiSpamOnMessage(
  client: Client,
  jail: Jail,
  message: Message
) {
  const now = Date.now();
  if (now - last_cleanup > 1000 * 60) {
    last_cleanup = now;
    cleanupAntispamMessages();
  }

  const author_member =
    message.member || message.guild.members.cache.get(message.author.id);

  if (
    !author_member ||
    !author_member.id ||
    author_member.id === BOT_ID ||
    author_member.roles.cache.has(ADMIN_ROLE_ID)
  ) {
    return;
  }

  const reputation = calculateReputation(message);
  handleNewReputation(client, jail, author_member, message, reputation);
}

/**
 *
 */
function calculateReputation(message: Message): AntispamMessage {
  const author = message.author?.id;

  if (!author) {
    return messageToAntiSpamMessage(message);
  }

  const previous = ANTISPAM_MESSAGES.get(author);

  if (!previous) {
    return messageToAntiSpamMessage(message);
  }

  // NOTE: use the current reputation for building the new object:
  const current = messageToAntiSpamMessage(message, previous.reputation);
  const delta = current.timestamp - previous.timestamp;

  // messages can be asynchronous, if we receive an older message than what we
  // already scanned then ignore:
  if (delta < 0) {
    return current;
  }

  const same_content = previous.content === current.content;
  const same_channel = previous.channel_id === current.channel_id;

  const one_second = 1000;
  const one_minute = 60 * one_second;

  if (same_content) {
    // the person is copy/pasting the same message:
    // -> not a big offense, but not great either
    current.reputation -= 2;

    if (!same_channel) {
      // copy/pasting but also accross multiple channels
      // -> it's starting to be spammy
      current.reputation -= 2;

      // without even waiting a bit between each copy
      if (delta < 10 * one_minute) {
        current.reputation -= 2;
      }

      if (delta < 5 * one_minute) {
        current.reputation -= 2;
      }

      if (delta < one_minute) {
        current.reputation -= 2;
      }

      // faster than a few seconds are certainly from bots:
      if (delta < 10 * one_second) {
        current.reputation -= 10;
      }

      if (delta < one_second) {
        current.reputation -= 100;
      }
    }

    if (message.mentions.users.size > 0) {
      current.reputation -= 2;
    }

    if (message.mentions.everyone) {
      current.reputation -= 100;
    }
  }

  // this case is not copy pasted comments but still across multiple channels
  if (!same_channel) {
    current.reputation -= 1;

    if (message.mentions.users.size > 0) {
      current.reputation -= 2;

      if (delta < one_minute) {
        current.reputation -= 3;
      }
    }

    if (current.content.includes("http://")) {
      current.reputation -= 2;
    }

    if (current.content.includes("https://")) {
      current.reputation -= 1;
    }

    // faster than a few seconds are certainly from bots:
    if (delta < 5 * one_second) {
      current.reputation -= 4;
    }

    if (delta < one_second) {
      current.reputation -= 6;
    }
  }

  // restore a bit of reputation on varied messages in same channels
  if (same_channel && !same_content) {
    current.reputation += 1;
  }

  current.tendency = current.reputation - previous.reputation;
  return current;
}

async function handleNewReputation(
  client: Client,
  jail: Jail,
  author: GuildMember,
  message: Message,
  antispam: AntispamMessage
) {
  if (!author.id) {
    return;
  }

  ANTISPAM_MESSAGES.set(author.id, antispam);

  if (antispam.tendency < 0) {
    log_reputation(client, author, antispam);
  }

  if (antispam.reputation > 0) {
    if (antispam.tendency < -3) {
      message.delete().catch(console.error);
      log_reputation_message_deleted(client, author, message);
    }

    return;
  }

  if (antispam.reputation < 0) {
    jail.restrict_message(message);
    log_reputation_user_shutdown(client, author, message);
  }
}

function cleanupAntispamMessages() {
  const keys = ANTISPAM_MESSAGES.keys();
  const now = Date.now();
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

function messageToAntiSpamMessage(
  message: Message,
  reputation: number = 10
): AntispamMessage {
  return {
    content: message.content,
    timestamp: Date.now(),
    channel_id: message.channelId,
    reputation,
    tendency: 0,
  };
}

import { Client, GuildMember, Message } from "discord.js";
import {
  log_message_from_jailed,
  log_reputation,
  log_reputation_message_deleted,
  log_reputation_user_shutdown,
} from "../logging";
import { JAIL } from "../jail";
import { AntispamMessage, messageToAntiSpamMessage } from "./types";
import {
  ANTISPAM_MESSAGES,
  RECENT_MESSAGES,
  cleanupAntispamMessages,
  getAntispamMessageByAuthorId,
} from "./caches";
import {
  ADMIN_ROLE_ID,
  BOT_ID,
  SHUT_ROLE,
  WELCOME_CHANNEL_ID,
} from "../../constants";
import { allowed_domains } from "../allowed_domains";

export async function antiSpamOnMessage(client: Client, message: Message) {
  cleanupAntispamMessages();

  const author_member =
    message.member || message.guild.members.cache.get(message.author.id);

  if (
    !author_member ||
    !author_member.id ||
    author_member.id === BOT_ID ||
    author_member.roles.cache.has(ADMIN_ROLE_ID) ||
    message.channel.id === WELCOME_CHANNEL_ID
  ) {
    return;
  }

  const jailed_user = JAIL.get_user(message);
  if (jailed_user !== null) {
    message.delete().catch(console.error);
    log_message_from_jailed(client, message, jailed_user);
    return;
  }

  RECENT_MESSAGES.insert(message);

  const reputation = calculateReputation(message, author_member);
  handleNewReputation(client, author_member, message, reputation);
}

/**
 *
 */
function calculateReputation(
  message: Message,
  author_member: GuildMember
): AntispamMessage {
  const author = message.author?.id;

  if (!author) {
    return messageToAntiSpamMessage(message);
  }

  const previous: AntispamMessage | null = getAntispamMessageByAuthorId(author);

  // NOTE: use the current reputation for building the new object:
  const current = messageToAntiSpamMessage(message, previous?.reputation ?? 10);
  const delta = current.timestamp - (previous?.timestamp ?? 0);

  // messages can be asynchronous, if we receive an older message than what we
  // already scanned then ignore:
  if (delta < 0) {
    return current;
  }

  const same_content =
    Boolean(previous?.content ?? "") && previous.content === current.content;
  const same_channel =
    (previous?.channel_id ?? 0) !== 0 &&
    previous.channel_id === current.channel_id;
  const has_unverified_link =
    current.content.includes("http://") || current.content.includes("https://");

  // 1 for the @everyone
  const author_has_role =
    author_member.roles.cache.size > 1 &&
    !author_member.roles.cache.has(SHUT_ROLE);
  const mentions_someone = message.mentions.users.size > 0;

  const one_second = 1000;
  const one_minute = 60 * one_second;

  const is_delta_normal = delta < one_minute;
  const is_delta_small = delta < 15 * one_second;
  const is_delta_small_very = delta < 5 * one_second;
  const is_delta_tiny = delta < one_second;

  if (same_content) {
    // the person is copy/pasting the same message:
    // -> not a big offense, but not great either
    current.reputation -= 1;

    if (!same_channel) {
      // copy/pasting but also accross multiple channels
      // -> it's starting to be spammy
      current.reputation -= 2;

      // without even waiting a bit between each copy
      if (is_delta_normal) {
        current.reputation -= 1;
      }

      // faster than a few seconds are certainly from bots:
      if (is_delta_small_very) {
        current.reputation -= 5;
      }

      if (is_delta_tiny) {
        current.reputation -= 5;
      }
    }

    if (message.mentions.users.size > 0) {
      current.reputation -= 2;
    }

    if (message.mentions.everyone) {
      current.reputation -= 100;
    }
  }

  if (!same_channel && has_unverified_link) {
    current.reputation -= 1;

    if (same_content) {
      current.reputation -= 1;
    }
  }

  if (is_delta_tiny) {
    current.reputation -= 0.5;
  }

  if (!same_channel && is_delta_small) {
    current.reputation -= 0.5;

    if (is_delta_small_very) {
      current.reputation -= 1;

      if (is_delta_tiny) {
        current.reputation -= 2.5;
      }
    }

    if (mentions_someone) {
      current.reputation -= 1;

      // punish repetitive pings even more if previous message was already bad
      if (previous?.tendency ?? 10 < 0) {
        current.reputation -= 1;
      }
    }
  }

  // measures to handle newcoming spammers who may send only one message:
  const is_first_message = !author_has_role && !Boolean(previous);
  const includes_dollar = message.content.includes("$");
  const includes_frequent_scam_word: number = [
    "steam",
    "telegram",
    "hours",
    "profit",
    "commission",
    "digital artist",
    "invest",
    "earn",
  ].filter((word) => message.content.includes(word)).length;
  const includes_gift = message.content.includes("gift");
  const includes_hidden_link =
    message.content.includes("[") &&
    message.content.includes("]") &&
    message.content.includes("(") &&
    message.content.includes(")");

  if (has_unverified_link) {
    current.reputation -= 0.5;

    if (!author_has_role) {
      current.reputation -= 1;
    }
  }

  if (mentions_someone && !author_has_role) {
    current.reputation -= 1;
  }

  if (includes_dollar) {
    current.reputation -= 0.25;

    if (!author_has_role) {
      current.reputation -= 1;
    }
  }

  if (includes_gift) {
    current.reputation -= 0.25;

    if (!author_has_role) {
      current.reputation -= 1;
    }
  }

  if (includes_hidden_link) {
    current.reputation -= 0.25;

    if (!author_has_role) {
      current.reputation -= 1.0;
    }
  }

  if (!author_has_role && includes_frequent_scam_word > 0) {
    current.reputation -= 1;
  }

  if (is_first_message) {
    if (includes_frequent_scam_word > 0) {
      current.reputation -= 1;
    }

    if (has_unverified_link) {
      current.reputation -= 0.5;
    }

    if (includes_frequent_scam_word > 0 && has_unverified_link) {
      current.reputation -= 2;
    }
  }

  if (has_unverified_link && mentions_someone) {
    current.reputation -= 0.25;

    if (!author_has_role) {
      current.reputation -= 1;
    }
  }

  const scam_infractions_count =
    [
      !author_has_role,
      includes_dollar,
      includes_gift,
      includes_hidden_link,
      has_unverified_link,
      message.content.includes("media.discordapp.net"),
      message.content.includes("%"),
    ].reduce((acc, cur) => (cur ? acc + 1 : acc), 0) +
    includes_frequent_scam_word;

  // punish further for multiple infractions that are
  // usually associated with scammers
  if (scam_infractions_count > 1) {
    current.reputation -= scam_infractions_count * 0.5;
  }

  // measures to restore reputation on valid behaviour
  if (previous) {
    if (!same_content && same_channel) {
      // restore a bit of reputation on varied messages in same channels
      current.reputation += 1;
    }

    if (!same_content && !same_channel) {
      current.reputation += 0.25;

      if (is_delta_normal) {
        current.reputation += 0.5;
      }
    }
  }

  current.tendency = current.reputation - (previous?.reputation ?? 10);
  return current;
}

async function handleNewReputation(
  client: Client,
  author: GuildMember,
  message: Message,
  antispam: AntispamMessage
) {
  if (!author.id) {
    return;
  }

  const author_has_role = author.roles.cache.size > 1;
  const previous = ANTISPAM_MESSAGES.get(author.id);
  const previous_tendency = previous?.tendency ?? 0;
  const previous_reputation = previous?.reputation ?? 10;

  if (previous_reputation < 0) {
    message.delete().catch(console.error);
    return;
  }

  ANTISPAM_MESSAGES.set(author.id, antispam);

  if ((!author_has_role || previous_tendency < 0) && antispam.tendency < 0) {
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
    const restricted_user = JAIL.restrict_message(message);
    log_reputation_user_shutdown(client, author, message, restricted_user);
    deleteRecentMessagesFromUser(author.id);
  }
}

function deleteRecentMessagesFromUser(id: GuildMember["id"]) {
  const messages_by_user = RECENT_MESSAGES.all().filter(
    (m) => m?.author?.id === id
  );

  for (const message of messages_by_user) {
    if (!message) {
      continue;
    }

    message.delete().catch(console.error);
  }
}

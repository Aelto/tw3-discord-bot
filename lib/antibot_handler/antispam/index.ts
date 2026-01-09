import { Client, GuildMember, Message } from "discord.js";
import {
  log_message_from_jailed,
  log_reputation,
  log_reputation_message_deleted,
  log_reputation_user_shutdown,
} from "../logging";
import { JAIL } from "../jail";
import { AntispamMessage } from "./types";
import { REPUTATION_CACHE, RECENT_MESSAGES } from "./caches";
import { ADMIN_ROLE_ID, BOT_ID, WELCOME_CHANNEL_ID } from "../../constants";
import { MESSAGE_REPUTATION_CALCULATOR } from "./reputation";
import { MessagePendingReputation } from "./reputation/pending_reputation";

export async function antiSpamOnMessage(client: Client, message: Message) {
  REPUTATION_CACHE.cleanupAntispamMessages();

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

  const [reputation, pending] =
    MESSAGE_REPUTATION_CALCULATOR.calculateReputation(message, author_member);

  handleNewReputation(client, author_member, message, reputation, pending);
}

async function handleNewReputation(
  client: Client,
  author: GuildMember,
  message: Message,
  antispam: AntispamMessage,
  pending: MessagePendingReputation
) {
  if (!author.id) {
    return;
  }

  const author_has_role = author.roles.cache.size > 1;
  const previous = REPUTATION_CACHE.getMessageFromAuthorId(author.id);
  const previous_tendency = previous?.tendency ?? 0;
  const previous_reputation = previous?.reputation ?? 10;

  if (previous_reputation < 0) {
    message.delete().catch(console.error);
    return;
  }

  REPUTATION_CACHE.setMessageCache(author.id, antispam);

  if (
    !author_has_role ||
    antispam.tendency < -3 ||
    (antispam.tendency < -1 && previous_tendency < 0)
  ) {
    log_reputation(client, author, antispam, pending);
  }

  if (antispam.reputation > 0) {
    // as reputation decreases, the threshold for the deletion of messages decreases
    const threshold_max = -3;
    const threshold_min = -6;
    const threshold = antispam.reputation * -1;
    const threshold_bound = Math.min(threshold_max, Math.max(threshold_min, threshold));

    if (antispam.tendency < threshold_bound) {
      message.delete().catch(console.error);
      log_reputation_message_deleted(client, author, message, pending);
    }
  } else {
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

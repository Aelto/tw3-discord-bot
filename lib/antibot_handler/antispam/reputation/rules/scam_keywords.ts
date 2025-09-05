import { GuildMember, Message } from "discord.js";
import { AntispamMessage } from "../../types";
import {
  MessagePendingReputation,
  ReputationRuleResultKey,
} from "../pending_reputation";
import { BaseMessageReputationRule } from "../rule";
import { SHUT_ROLE } from "../../../../constants";

export class ScamKeywordsDetection extends BaseMessageReputationRule {
  process(
    message: Message,
    current: AntispamMessage,
    previous: AntispamMessage | null,
    author_member: GuildMember,
    pending: MessagePendingReputation
  ): void {
    const [author_has_role, is_first_message, has_link] = pending.getVars([
      ReputationRuleResultKey.AuthorHasRole,
      ReputationRuleResultKey.FirstMessage,
      ReputationRuleResultKey.HasLink,
    ]);

    const scam_word_count: number = [
      "steam",
      "telegram",
      "hours",
      "profit",
      "commission",
      "digital artist",
      "invest",
      "earn",
      "upwork",
      "earn",
      "freelanc",
      "pay",
      "DM",
      "business",
      "dropshipping",
      "$",
      "gift",
      "media.discordapp.net",
      "%",
    ].filter((word) => message.content.includes(word)).length;

    const includes_hidden_link =
      message.content.includes("[") &&
      message.content.includes("]") &&
      message.content.includes("(") &&
      message.content.includes(")");

    pending.append_if(
      !author_has_role && has_link,
      "Author has no role and sent a link",
      -0.5
    );

    pending.append_if(
      !author_has_role && !is_first_message && has_link,
      "Author has no role, never sent a message, and sent a link",
      -1
    );

    pending.append_if(
      !author_has_role && scam_word_count > 0,
      "Author has no role and message contains scam-y words",
      -1
    );

    pending.append_if(
      is_first_message && scam_word_count > 0,
      "Author has not sent a message in a long time and message contains scam-y words",
      -1
    );

    pending.append_if(
      includes_hidden_link && (is_first_message || author_has_role),
      "Message contains hidden link and author has not sent a message in a long time or has no role",
      -3
    );

    pending.append_if(
      scam_word_count > 0,
      "Message contains scam-y words (punishment varies with words count)",
      scam_word_count * 0.5
    );
  }
}

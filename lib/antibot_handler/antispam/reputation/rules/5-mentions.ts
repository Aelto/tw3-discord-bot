import { GuildMember, Message } from "discord.js";
import { AntispamMessage } from "../../types";
import {
  MessagePendingReputation,
  ReputationRuleResultKey,
} from "../pending_reputation";
import { BaseMessageReputationRule } from "../rule";
import { SHUT_ROLE } from "../../../../constants";

export class MentionsDetection extends BaseMessageReputationRule {
  process(
    message: Message,
    current: AntispamMessage,
    previous: AntispamMessage | null,
    author_member: GuildMember,
    pending: MessagePendingReputation
  ): void {
    const has_role = Boolean(
      pending.getVar(ReputationRuleResultKey.AuthorHasRole)
    );

    const mentions_count = message.mentions.users.size;
    const mentions_someone = mentions_count > 0;
    const mentions_everyone = message.mentions.everyone;

    pending.setVar(ReputationRuleResultKey.MentionsSomeone, mentions_someone);

    if (mentions_everyone) {
      pending.append("Message mentions everyone", -100);
    }

    if (mentions_someone) {
      // exponential amount to punish multi-pings further
      const amount = mentions_count * mentions_count;

      if (has_role) {
        const change = -0.5;

        pending.append(
          "Message mentions one or more persons (author has a role)",
          amount * change
        );
      } else {
        const change = -1.0;

        pending.append(
          "Message mentions one or more persons (author DOES NOT have a role)",
          amount * change
        );
      }
    }
  }
}

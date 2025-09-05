import { GuildMember, Message } from "discord.js";
import { AntispamMessage } from "../../types";
import {
  MessagePendingReputation,
  ReputationRuleResultKey,
} from "../pending_reputation";
import { BaseMessageReputationRule } from "../rule";
import { SHUT_ROLE } from "../../../../constants";

export class PositiveGainsDetection extends BaseMessageReputationRule {
  process(
    message: Message,
    current: AntispamMessage,
    previous: AntispamMessage | null,
    author_member: GuildMember,
    pending: MessagePendingReputation
  ): void {
    const [author_has_role, is_first_message, has_link, is_delta_normal] =
      pending.getVars([
        ReputationRuleResultKey.AuthorHasRole,
        ReputationRuleResultKey.FirstMessage,
        ReputationRuleResultKey.HasLink,
        ReputationRuleResultKey.PreviousMessageDeltaNormal,
      ]);

    pending.append("Author sent a message", +0.5);

    pending.append_if(
      is_delta_normal,
      "Author sent a message (with normal or longer delta)",
      +0.5
    );

    pending.append_if(
      is_first_message && author_has_role,
      "Author sent a message with no activity for a long time and with necessary roles",
      +2
    );

    pending.append_if(
      is_delta_normal && author_has_role && has_link && !is_first_message,
      "Author sent a message with a normal, with the necessary roles, and with a link",
      +0.25
    );
  }
}

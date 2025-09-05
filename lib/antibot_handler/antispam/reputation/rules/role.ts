import { GuildMember, Message } from "discord.js";
import { AntispamMessage } from "../../types";
import {
  MessagePendingReputation,
  ReputationRuleResultKey,
} from "../pending_reputation";
import { BaseMessageReputationRule } from "../rule";
import { SHUT_ROLE } from "../../../../constants";

export class RoleDetection extends BaseMessageReputationRule {
  process(
    message: Message,
    current: AntispamMessage,
    previous: AntispamMessage | null,
    author_member: GuildMember,
    pending: MessagePendingReputation
  ): void {
    const author_has_role =
      author_member.roles.cache.size > 1 &&
      !author_member.roles.cache.has(SHUT_ROLE);

    pending.setVar(ReputationRuleResultKey.AuthorHasRole, author_has_role);

    pending.append_if(!author_has_role, "Author has no role", -0.1);
  }
}

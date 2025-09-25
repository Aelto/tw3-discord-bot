import { GuildMember, Message } from "discord.js";
import { AntispamMessage } from "../../types";
import {
  MessagePendingReputation,
  ReputationRuleResultKey,
} from "../pending_reputation";
import { BaseMessageReputationRule } from "../rule";
import { SHUT_ROLE } from "../../../../constants";

export class FirstMessageDetection extends BaseMessageReputationRule {
  process(
    message: Message,
    current: AntispamMessage,
    previous: AntispamMessage | null,
    author_member: GuildMember,
    pending: MessagePendingReputation
  ): void {
    const author_has_role = pending.getVar(
      ReputationRuleResultKey.AuthorHasRole
    );

    const is_first_message = !author_has_role && previous === null;

    pending.setVar(ReputationRuleResultKey.FirstMessage, is_first_message);
  }
}

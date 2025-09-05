import { GuildMember, Message } from "discord.js";
import { AntispamMessage } from "../../types";
import {
  MessagePendingReputation,
  ReputationRuleResultKey,
} from "../pending_reputation";
import { BaseMessageReputationRule } from "../rule";
import { SHUT_ROLE } from "../../../../constants";

export class SameContentDetection extends BaseMessageReputationRule {
  process(
    message: Message,
    current: AntispamMessage,
    previous: AntispamMessage | null,
    author_member: GuildMember,
    pending: MessagePendingReputation
  ): void {
    const same_content =
      Boolean(previous?.content ?? "") && previous.content === current.content;

    pending.setVar(
      ReputationRuleResultKey.PreviousMessageSameContent,
      same_content
    );

    if (!same_content) {
      pending.append("Previous & current messages have the same content", -1);
    }
  }
}

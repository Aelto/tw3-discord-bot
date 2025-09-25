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
      (previous?.content ?? "").length > 0 &&
      previous.content === current.content;

    pending.setVar(
      ReputationRuleResultKey.PreviousMessageSameContent,
      same_content
    );

    if (same_content) {
      pending.append("Previous & current messages have the same content", -1);
    }

    pending.append_if(
      current.content.length > 500,
      "Previous & current messages have the same content (long message)",
      -1
    );
  }
}

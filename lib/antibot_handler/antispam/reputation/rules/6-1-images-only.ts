import { Message, GuildMember } from "discord.js";
import {
  MessagePendingReputation,
  ReputationRuleResultKey,
} from "../pending_reputation";
import { BaseMessageReputationRule } from "../rule";
import { AntispamMessage } from "../../types";

export class AttachmentsDetection extends BaseMessageReputationRule {
  process(
    message: Message,
    current: AntispamMessage,
    previous: AntispamMessage | null,
    author_member: GuildMember,
    pending: MessagePendingReputation,
  ): void {
    const [same_content, has_role, mentions_someone, has_link] =
      pending.getVars([
        ReputationRuleResultKey.PreviousMessageSameContent,
        ReputationRuleResultKey.AuthorHasRole,
        ReputationRuleResultKey.MentionsSomeone,
        ReputationRuleResultKey.HasLink,
      ]);

    const message_is_empty = message.content.trim().length < 5;
    const powered_attachments_count = Math.round(
      Math.pow(message.attachments.size, 1.25),
    );

    pending.append_if(
      message.attachments.size > 0,
      "Message contains attachments",
      message.attachments.size * -0.5,
    );

    // the punishment for people without roles is high because a role is needed
    // to post images. Anyone bypassing that limit (somehow) deserves to lose a
    // lot of reputation.
    pending.append_if(
      !has_role && message.attachments.size > 1,
      "User has no role and message contains 2 or more attachments",
      -3 * powered_attachments_count,
    );

    pending.append_if(
      !has_role && message.attachments.size > 0,
      "User has no role and message contains attachments",
      -3 * powered_attachments_count,
    );

    pending.append_if(
      message_is_empty && message.attachments.size > 0,
      "message is short or empty but contains attachments",
      -1 * powered_attachments_count,
    );

    pending.append_if(
      !has_role && message_is_empty && message.attachments.size > 0,
      "user has no role and message is short or empty but contains attachments",
      -1 * powered_attachments_count,
    );

    pending.append_if(
      mentions_someone && message.attachments.size > 0,
      "mentions someone and message contains attachments",
      -1 * powered_attachments_count,
    );
  }
}

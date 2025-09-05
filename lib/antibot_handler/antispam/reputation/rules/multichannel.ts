import { Message, GuildMember } from "discord.js";
import {
  MessagePendingReputation,
  ReputationRuleResultKey,
} from "../pending_reputation";
import { BaseMessageReputationRule } from "../rule";
import { AntispamMessage } from "../../types";

export class SpamDeltaDetection extends BaseMessageReputationRule {
  process(
    message: Message,
    current: AntispamMessage,
    previous: AntispamMessage | null,
    author_member: GuildMember,
    pending: MessagePendingReputation
  ): void {
    const [same_content, has_role, mentions_someone, has_link] =
      pending.getVars([
        ReputationRuleResultKey.PreviousMessageSameContent,
        ReputationRuleResultKey.AuthorHasRole,
        ReputationRuleResultKey.MentionsSomeone,
        ReputationRuleResultKey.HasLink,
      ]);

    const delta = current.timestamp - (previous?.timestamp ?? 0);
    pending.setVar(ReputationRuleResultKey.PreviousMessageDelta, delta);

    const same_channel =
      (previous?.channel_id ?? 0) !== 0 &&
      previous.channel_id === current.channel_id;
    pending.setVar(
      ReputationRuleResultKey.PreviousMessageSameChannel,
      same_channel
    );

    const one_second = 1000;
    const one_minute = 60 * one_second;

    const is_delta_normal = delta > one_minute;
    const is_delta_small = delta < 15 * one_second;
    const is_delta_small_very = delta < 5 * one_second;
    const is_delta_tiny = delta < one_second;

    pending.setVar(
      ReputationRuleResultKey.PreviousMessageDeltaNormal,
      is_delta_normal
    );

    pending.append_if(
      is_delta_small,
      "Small delta between multiple messages",
      -0.1
    );
    pending.append_if(
      is_delta_small_very,
      "Very small delta between multiple messages",
      -0.15
    );

    pending.append_if(
      is_delta_tiny,
      "Tiny delta between multiple messages",
      -0.25
    );

    pending.append_if(
      same_content && !same_channel,
      "Identical messages sent across multiple channels",
      -2
    );

    pending.append_if(
      same_content && !same_channel && !has_role,
      "Identical messages sent across multiple channels (has no role)",
      -2
    );

    pending.append_if(
      same_content && !same_channel && is_delta_normal,
      "Identical messages sent across multiple channels (normal delta)",
      -1
    );

    pending.append_if(
      same_content && !same_channel && is_delta_small_very,
      "Identical messages sent across multiple channels (very small delta)",
      -5
    );

    pending.append_if(
      same_content && !same_channel && is_delta_tiny,
      "Identical messages sent across multiple channels (tiny delta)",
      -5
    );

    pending.append_if(
      same_content && is_delta_small && has_link,
      "Message is identical to a previous message, contains a link, and was sent repeatedly in the last 15 seconds",
      -2
    );

    pending.append_if(
      is_delta_small && mentions_someone,
      "Message mentions someone and the author is sending many messages in the last 30 seconds",
      -2
    );
  }
}

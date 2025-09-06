import { GuildMember, Message } from "discord.js";
import { AntispamMessage, messageToAntiSpamMessage } from "../types";
import { getAntispamMessageByAuthorId } from "../caches";
import { BaseMessageReputationRule } from "./rule";
import { MessagePendingReputation } from "./pending_reputation";
import { RoleDetection } from "./rules/role";
import { SpamDeltaDetection } from "./rules/multichannel";
import { SameContentDetection } from "./rules/same_content";
import { MentionsDetection } from "./rules/mentions";
import { LinkDetection } from "./rules/links";
import { FirstMessageDetection } from "./rules/first_message";
import { ScamKeywordsDetection } from "./rules/scam_keywords";
import { PositiveGainsDetection } from "./rules/positive_gains";

class MessageReputationCalculator {
  rules: BaseMessageReputationRule[];

  constructor() {
    // Append the rules to apply in this array,
    // ORDER IS IMPORTANT because of the variables
    this.rules = [
      // these don't need any external variables:
      new LinkDetection(),
      new RoleDetection(),
      new SameContentDetection(),

      new FirstMessageDetection(),
      new ScamKeywordsDetection(),
      new MentionsDetection(),
      new SpamDeltaDetection(),

      new PositiveGainsDetection(),
    ];
  }

  calculateReputation(
    message: Message,
    author_member: GuildMember
  ): [AntispamMessage, MessagePendingReputation] {
    const author = message.author?.id;
    const pending = new MessagePendingReputation();

    if (!author) {
      return [messageToAntiSpamMessage(message), pending];
    }

    const previous: AntispamMessage | null =
      getAntispamMessageByAuthorId(author);

    // NOTE: use the current reputation for building the new object:
    const current = messageToAntiSpamMessage(
      message,
      previous?.reputation ?? 10
    );
    const delta = current.timestamp - (previous?.timestamp ?? 0);

    // messages can be asynchronous, if we receive an older message than what we
    // already scanned then ignore:
    if (delta < 0) {
      return [current, pending];
    }

    for (const rule of this.rules) {
      rule.process(message, current, previous, author_member, pending);
    }

    current.reputation += pending.getTotalChange();
    pending.logMissingVars();

    return [current, pending];
  }
}

export const MESSAGE_REPUTATION_CALCULATOR = new MessageReputationCalculator();

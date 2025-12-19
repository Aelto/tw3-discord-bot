import { GuildMember, Message } from "discord.js";
import { AntispamMessage } from "../../types";
import {
  MessagePendingReputation,
  ReputationRuleResultKey,
} from "../pending_reputation";
import { BaseMessageReputationRule } from "../rule";

export class LinkDetection extends BaseMessageReputationRule {
  process(
    message: Message,
    current: AntispamMessage,
    previous: AntispamMessage | null,
    author_member: GuildMember,
    pending: MessagePendingReputation
  ): void {
    const has_http_link = current.content.includes("http://");
    const has_link = has_http_link || current.content.includes("https://");

    pending.setVar(ReputationRuleResultKey.HasLink, has_link);

    pending.append_if(has_link, "Message contains a link", -0.5);
    pending.append_if(
      has_http_link,
      "Message contains an insecure (HTTP) link",
      -10
    );

    if (has_link) {
      const count = current.content.split("http").length - 1;

      pending.append_if(
        count > 1,
        "Message contains multiple links",
        -1 * count
      );
    }
  }
}

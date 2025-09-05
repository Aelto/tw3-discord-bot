import { GuildMember, Message } from "discord.js";
import {
  MessagePendingReputation,
  ReputationRuleResultKey,
} from "./pending_reputation";
import { AntispamMessage } from "../types";

/**
 *
 */
export class BaseMessageReputationRule {
  process(
    message: Message,
    current: AntispamMessage,
    previous: AntispamMessage | null,
    author_member: GuildMember,
    pending: MessagePendingReputation
  ) {}
}

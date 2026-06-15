"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentsDetection = void 0;
const pending_reputation_1 = require("../pending_reputation");
const rule_1 = require("../rule");
class AttachmentsDetection extends rule_1.BaseMessageReputationRule {
    process(message, current, previous, author_member, pending) {
        const [same_content, has_role, mentions_someone, has_link] = pending.getVars([
            pending_reputation_1.ReputationRuleResultKey.PreviousMessageSameContent,
            pending_reputation_1.ReputationRuleResultKey.AuthorHasRole,
            pending_reputation_1.ReputationRuleResultKey.MentionsSomeone,
            pending_reputation_1.ReputationRuleResultKey.HasLink,
        ]);
        const message_is_empty = message.content.trim().length < 5;
        const powered_attachments_count = Math.round(Math.pow(message.attachments.size, 1.25));
        pending.append_if(message.attachments.size > 0, "Message contains attachments", message.attachments.size * -0.5);
        pending.append_if(!has_role && message.attachments.size > 1, "User has no role and message contains 2 or more attachments", -1 * powered_attachments_count);
        pending.append_if(!has_role && message.attachments.size > 0, "User has no role and message contains attachments", -1 * powered_attachments_count);
        pending.append_if(message_is_empty && message.attachments.size > 0, "message is short or empty but contains attachments", -1 * powered_attachments_count);
        pending.append_if(mentions_someone && message.attachments.size > 0, "mentions someone and message contains attachments", -1 * powered_attachments_count);
    }
}
exports.AttachmentsDetection = AttachmentsDetection;

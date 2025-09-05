"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentionsDetection = void 0;
const pending_reputation_1 = require("../pending_reputation");
const rule_1 = require("../rule");
class MentionsDetection extends rule_1.BaseMessageReputationRule {
    process(message, current, previous, author_member, pending) {
        const has_role = Boolean(pending.getVar(pending_reputation_1.ReputationRuleResultKey.AuthorHasRole));
        const mentions_count = message.mentions.users.size;
        const mentions_someone = mentions_count > 0;
        const mentions_everyone = message.mentions.everyone;
        pending.setVar(pending_reputation_1.ReputationRuleResultKey.MentionsSomeone, mentions_someone);
        if (mentions_everyone) {
            pending.append("Message mentions everyone", -100);
        }
        if (mentions_someone) {
            // exponential amount to punish multi-pings further
            const amount = mentions_count * mentions_count;
            if (has_role) {
                const change = -0.1;
                pending.append("Message mentions one or more persons (author has a role)", amount * change);
            }
            else {
                const change = -0.5;
                pending.append("Message mentions one or more persons (author DOES NOT have a role)", amount * change);
            }
        }
    }
}
exports.MentionsDetection = MentionsDetection;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositiveGainsDetection = void 0;
const pending_reputation_1 = require("../pending_reputation");
const rule_1 = require("../rule");
class PositiveGainsDetection extends rule_1.BaseMessageReputationRule {
    process(message, current, previous, author_member, pending) {
        const [author_has_role, is_first_message, has_link, is_delta_normal] = pending.getVars([
            pending_reputation_1.ReputationRuleResultKey.AuthorHasRole,
            pending_reputation_1.ReputationRuleResultKey.FirstMessage,
            pending_reputation_1.ReputationRuleResultKey.HasLink,
            pending_reputation_1.ReputationRuleResultKey.PreviousMessageDeltaNormal,
        ]);
        pending.append("Author sent a message", +0.5);
        pending.append_if(is_delta_normal, "Author sent a message (with normal or longer delta)", +0.5);
        pending.append_if(is_first_message && author_has_role, "Author sent a message with no activity for a long time and with necessary roles", +2);
        pending.append_if(is_delta_normal && author_has_role && has_link && !is_first_message, "Author sent a message with a normal, with the necessary roles, and with a link", +0.25);
    }
}
exports.PositiveGainsDetection = PositiveGainsDetection;

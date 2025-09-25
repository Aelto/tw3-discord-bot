"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirstMessageDetection = void 0;
const pending_reputation_1 = require("../pending_reputation");
const rule_1 = require("../rule");
class FirstMessageDetection extends rule_1.BaseMessageReputationRule {
    process(message, current, previous, author_member, pending) {
        const author_has_role = pending.getVar(pending_reputation_1.ReputationRuleResultKey.AuthorHasRole);
        const is_first_message = !author_has_role && previous === null;
        pending.setVar(pending_reputation_1.ReputationRuleResultKey.FirstMessage, is_first_message);
    }
}
exports.FirstMessageDetection = FirstMessageDetection;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SameContentDetection = void 0;
const pending_reputation_1 = require("../pending_reputation");
const rule_1 = require("../rule");
class SameContentDetection extends rule_1.BaseMessageReputationRule {
    process(message, current, previous, author_member, pending) {
        const same_content = (previous?.content ?? "").length > 0 &&
            previous.content === current.content;
        pending.setVar(pending_reputation_1.ReputationRuleResultKey.PreviousMessageSameContent, same_content);
        if (same_content) {
            pending.append("Previous & current messages have the same content", -1);
        }
        pending.append_if(current.content.length > 500, "Previous & current messages have the same content (long message)", -1);
    }
}
exports.SameContentDetection = SameContentDetection;

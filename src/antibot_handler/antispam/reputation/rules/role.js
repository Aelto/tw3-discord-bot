"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleDetection = void 0;
const pending_reputation_1 = require("../pending_reputation");
const rule_1 = require("../rule");
const constants_1 = require("../../../../constants");
class RoleDetection extends rule_1.BaseMessageReputationRule {
    process(message, current, previous, author_member, pending) {
        const author_has_role = author_member.roles.cache.size > 1 &&
            !author_member.roles.cache.has(constants_1.SHUT_ROLE);
        pending.setVar(pending_reputation_1.ReputationRuleResultKey.AuthorHasRole, author_has_role);
        pending.append_if(!author_has_role, "Author has no role", -0.1);
    }
}
exports.RoleDetection = RoleDetection;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReputationRuleResultKey = exports.MessagePendingReputation = void 0;
class MessagePendingReputation {
    changes = [];
    vars = new Map();
    missing_vars = [];
    append(reason, change) {
        this.changes.push({ reason, reputation_change: change });
    }
    append_if(condition, reason, change) {
        if (condition) {
            this.append(reason, change);
        }
    }
    setVar(key, value) {
        this.vars.set(key, value);
    }
    getVar(key) {
        const value = this.vars.get(key);
        // for logging mostly, to detect incorrect ordering of rules
        if (value === undefined) {
            this.missing_vars.push(key);
        }
        return value;
    }
    getVars(keys) {
        return keys.map((key) => this.getVar(key));
    }
    getTotalChange() {
        return this.changes.reduce((acc, n) => acc + n.reputation_change, 0);
    }
    log() {
        if (this.missing_vars.length > 0) {
            const vars = this.missing_vars.map((v) => v.toString()).join(", ");
            console.log("PendingReputation, missing vars: " + vars);
        }
    }
    toString() {
        return this.changes
            .map((change) => `- **__${change.reputation_change}__**: ${change.reason}`)
            .join("\n");
    }
}
exports.MessagePendingReputation = MessagePendingReputation;
var ReputationRuleResultKey;
(function (ReputationRuleResultKey) {
    ReputationRuleResultKey[ReputationRuleResultKey["PreviousMessageDelta"] = 0] = "PreviousMessageDelta";
    ReputationRuleResultKey[ReputationRuleResultKey["PreviousMessageDeltaNormal"] = 1] = "PreviousMessageDeltaNormal";
    ReputationRuleResultKey[ReputationRuleResultKey["PreviousMessageSameContent"] = 2] = "PreviousMessageSameContent";
    ReputationRuleResultKey[ReputationRuleResultKey["PreviousMessageSameChannel"] = 3] = "PreviousMessageSameChannel";
    ReputationRuleResultKey[ReputationRuleResultKey["AuthorHasRole"] = 4] = "AuthorHasRole";
    ReputationRuleResultKey[ReputationRuleResultKey["MentionsSomeone"] = 5] = "MentionsSomeone";
    ReputationRuleResultKey[ReputationRuleResultKey["HasLink"] = 6] = "HasLink";
    ReputationRuleResultKey[ReputationRuleResultKey["FirstMessage"] = 7] = "FirstMessage";
})(ReputationRuleResultKey || (exports.ReputationRuleResultKey = ReputationRuleResultKey = {}));

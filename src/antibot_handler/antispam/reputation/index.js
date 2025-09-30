"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_REPUTATION_CALCULATOR = void 0;
const types_1 = require("../types");
const caches_1 = require("../caches");
const pending_reputation_1 = require("./pending_reputation");
const _1_roles_1 = require("./rules/1-roles");
const _6_multichannel_1 = require("./rules/6-multichannel");
const _2_same_content_1 = require("./rules/2-same-content");
const _5_mentions_1 = require("./rules/5-mentions");
const _0_links_1 = require("./rules/0-links");
const _3_first_message_1 = require("./rules/3-first-message");
const _4_scam_keywords_1 = require("./rules/4-scam_keywords");
const _7_positive_gains_1 = require("./rules/7-positive_gains");
class MessageReputationCalculator {
    rules;
    constructor() {
        // Append the rules to apply in this array,
        // ORDER IS IMPORTANT because of the variables
        this.rules = [
            // these don't need any external variables:
            new _0_links_1.LinkDetection(),
            new _1_roles_1.RoleDetection(),
            new _2_same_content_1.SameContentDetection(),
            new _3_first_message_1.FirstMessageDetection(),
            new _4_scam_keywords_1.ScamKeywordsDetection(),
            new _5_mentions_1.MentionsDetection(),
            new _6_multichannel_1.SpamDeltaDetection(),
            new _7_positive_gains_1.PositiveGainsDetection(),
        ];
    }
    calculateReputation(message, author_member) {
        const author = message.author?.id;
        const pending = new pending_reputation_1.MessagePendingReputation();
        if (!author) {
            return [(0, types_1.messageToAntiSpamMessage)(message), pending];
        }
        const previous = (0, caches_1.getAntispamMessageByAuthorId)(author);
        // NOTE: use the current reputation for building the new object:
        const current = (0, types_1.messageToAntiSpamMessage)(message, previous?.reputation ?? 10);
        const delta = current.timestamp - (previous?.timestamp ?? 0);
        // messages can be asynchronous, if we receive an older message than what we
        // already scanned then ignore:
        if (delta < 0) {
            return [current, pending];
        }
        for (const rule of this.rules) {
            rule.process(message, current, previous, author_member, pending);
        }
        current.tendency = pending.getTotalChange();
        current.reputation += current.tendency;
        pending.log();
        return [current, pending];
    }
}
exports.MESSAGE_REPUTATION_CALCULATOR = new MessageReputationCalculator();

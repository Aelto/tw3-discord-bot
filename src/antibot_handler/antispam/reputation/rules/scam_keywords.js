"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScamKeywordsDetection = void 0;
const pending_reputation_1 = require("../pending_reputation");
const rule_1 = require("../rule");
class ScamKeywordsDetection extends rule_1.BaseMessageReputationRule {
    process(message, current, previous, author_member, pending) {
        const [author_has_role, is_first_message, has_link, normal_delta] = pending.getVars([
            pending_reputation_1.ReputationRuleResultKey.AuthorHasRole,
            pending_reputation_1.ReputationRuleResultKey.FirstMessage,
            pending_reputation_1.ReputationRuleResultKey.HasLink,
            pending_reputation_1.ReputationRuleResultKey.PreviousMessageDeltaNormal,
        ]);
        const lowercased = message.content.toLowerCase();
        const scam_word_count = [
            "steam",
            "telegram",
            "hours",
            "profit",
            "commission",
            "digital artist",
            "invest",
            "earn",
            "upwork",
            "earn",
            "freelanc",
            "pay",
            "dm",
            "business",
            "dropshipping",
            "$",
            "gift",
            "media.discordapp.net",
            "%",
            "whatsapp",
            "hiring",
            "work",
            "remote",
        ].reduce((acc, word) => (lowercased.includes(word) ? acc + 1 : acc), 0);
        const includes_hidden_link = lowercased.includes("[") &&
            lowercased.includes("]") &&
            lowercased.includes("(") &&
            lowercased.includes(")");
        pending.append_if(!author_has_role && has_link, "Author has no role and sent a link", -0.5);
        pending.append_if(!author_has_role && !is_first_message && has_link, "Author has no role, never sent a message, and sent a link", -1);
        pending.append_if(!author_has_role && scam_word_count > 0, "Author has no role and message contains scam-y words", -2);
        pending.append_if(is_first_message && scam_word_count > 0, "Author has not sent a message in a long time and message contains scam-y words", -2);
        pending.append_if(!normal_delta && scam_word_count > 0, "Author has sent multiple message with a smal delta, and message contains scam-y words", -1);
        pending.append_if(!author_has_role && !normal_delta && scam_word_count > 0, "Author has sent multiple message with a smal delta, and message contains scam-y words (no role)", -1);
        pending.append_if(includes_hidden_link && (is_first_message || author_has_role), "Message contains hidden link and author has not sent a message in a long time or has no role", -3);
        pending.append_if(scam_word_count > 0, "Message contains scam-y words (punishment varies with words count)", scam_word_count * 0.75 * -1);
    }
}
exports.ScamKeywordsDetection = ScamKeywordsDetection;

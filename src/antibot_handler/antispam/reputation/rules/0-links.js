"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkDetection = void 0;
const pending_reputation_1 = require("../pending_reputation");
const rule_1 = require("../rule");
class LinkDetection extends rule_1.BaseMessageReputationRule {
    process(message, current, previous, author_member, pending) {
        const has_http_link = current.content.includes("http://");
        const has_link = has_http_link || current.content.includes("https://");
        pending.setVar(pending_reputation_1.ReputationRuleResultKey.HasLink, has_link);
        pending.append_if(has_link, "Message contains a link", -0.5);
        pending.append_if(has_http_link, "Message contains an insecure (HTTP) link", -10);
    }
}
exports.LinkDetection = LinkDetection;

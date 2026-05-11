"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.antiSpamOnMessage = antiSpamOnMessage;
const logging_1 = require("../logging");
const jail_1 = require("../jail");
const caches_1 = require("./caches");
const constants_1 = require("../../constants");
const reputation_1 = require("./reputation");
const deferred_set_1 = require("../../datatypes/deferred-set");
const discord_utils_1 = require("../../discord_utils");
const message_deletion_alert_debouncer = new deferred_set_1.DeferredSet(2, 60 * 5);
async function antiSpamOnMessage(client, message) {
    caches_1.REPUTATION_CACHE.cleanupAntispamMessages();
    const author_member = message.member || message.guild.members.cache.get(message.author.id);
    if (!author_member ||
        !author_member.id ||
        author_member.id === constants_1.BOT_ID ||
        author_member.roles.cache.has(constants_1.ADMIN_ROLE_ID) ||
        message.channel.id === constants_1.WELCOME_CHANNEL_ID) {
        return;
    }
    const jailed_user = jail_1.JAIL.get_user(message);
    if (jailed_user !== null) {
        (0, discord_utils_1.deleteMessage)(message);
        (0, logging_1.log_message_from_jailed)(client, message, jailed_user);
        return;
    }
    caches_1.RECENT_MESSAGES.insert(message);
    const [reputation, pending] = reputation_1.MESSAGE_REPUTATION_CALCULATOR.calculateReputation(message, author_member);
    handleNewReputation(client, author_member, message, reputation, pending);
}
async function handleNewReputation(client, author, message, antispam, pending) {
    if (!author.id) {
        return;
    }
    const author_has_role = author.roles.cache.size > 1;
    const previous = caches_1.REPUTATION_CACHE.getMessageFromAuthorId(author.id);
    const previous_tendency = previous?.tendency ?? 0;
    const previous_reputation = previous?.reputation ?? 10;
    if (previous_reputation < 0) {
        (0, discord_utils_1.deleteMessage)(message);
        return;
    }
    caches_1.REPUTATION_CACHE.setMessageCache(author.id, antispam);
    if (!author_has_role ||
        antispam.tendency < -3 ||
        (antispam.tendency < -1 && previous_tendency < 0)) {
        (0, logging_1.log_reputation)(client, author, antispam, pending);
    }
    if (antispam.reputation > 0) {
        // as reputation decreases, the threshold for the deletion of messages decreases
        const threshold_max = -3;
        const threshold_min = -6;
        const threshold = antispam.reputation * -1;
        const threshold_bound = Math.min(threshold_max, Math.max(threshold_min, threshold));
        if (antispam.tendency < threshold_bound) {
            (0, discord_utils_1.deleteMessage)(message);
            (0, logging_1.log_reputation_message_deleted)(client, author, message, pending);
            // perform a debounced alert to the user about why the message(s)
            // are being deleted.
            message_deletion_alert_debouncer.set(author.id, () => {
                (0, logging_1.log_inform_user_message_deleted)(author, message, pending);
            });
        }
    }
    else {
        const restricted_user = jail_1.JAIL.restrict_message(message);
        (0, logging_1.log_reputation_user_shutdown)(client, author, message, restricted_user);
        deleteRecentMessagesFromUser(author.id);
    }
}
function deleteRecentMessagesFromUser(id) {
    const messages_by_user = caches_1.RECENT_MESSAGES.all().filter((m) => m?.author?.id === id);
    for (const message of messages_by_user) {
        if (!message) {
            continue;
        }
        (0, discord_utils_1.deleteMessage)(message);
    }
}

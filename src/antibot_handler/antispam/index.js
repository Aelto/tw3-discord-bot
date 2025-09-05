"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.antiSpamOnMessage = antiSpamOnMessage;
const logging_1 = require("../logging");
const jail_1 = require("../jail");
const caches_1 = require("./caches");
const constants_1 = require("../../constants");
const reputation_1 = require("./reputation");
async function antiSpamOnMessage(client, message) {
    (0, caches_1.cleanupAntispamMessages)();
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
        message.delete().catch(console.error);
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
    const previous = caches_1.ANTISPAM_MESSAGES.get(author.id);
    const previous_tendency = previous?.tendency ?? 0;
    const previous_reputation = previous?.reputation ?? 10;
    if (previous_reputation < 0) {
        message.delete().catch(console.error);
        return;
    }
    caches_1.ANTISPAM_MESSAGES.set(author.id, antispam);
    if ((!author_has_role || previous_tendency < 0) && antispam.tendency < 0) {
        (0, logging_1.log_reputation)(client, author, antispam, pending);
    }
    if (antispam.reputation > 0) {
        if (antispam.tendency < -3) {
            message.delete().catch(console.error);
            (0, logging_1.log_reputation_message_deleted)(client, author, message, pending);
        }
        return;
    }
    if (antispam.reputation < 0) {
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
        message.delete().catch(console.error);
    }
}

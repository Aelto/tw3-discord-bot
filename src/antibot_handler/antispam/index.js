"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.antiSpamOnMessage = void 0;
const logging_1 = require("../logging");
const types_1 = require("./types");
const caches_1 = require("./caches");
const { BOT_ID, ADMIN_ROLE_ID } = require("../constants.js");
async function antiSpamOnMessage(client, jail, message) {
    (0, caches_1.cleanupAntispamMessages)();
    const author_member = message.member || message.guild.members.cache.get(message.author.id);
    if (!author_member ||
        !author_member.id ||
        author_member.id === BOT_ID ||
        author_member.roles.cache.has(ADMIN_ROLE_ID)) {
        return;
    }
    if (jail.is_jailed(message)) {
        message.delete().catch(console.error);
        (0, logging_1.log_message_from_jailed)(client, message);
        return;
    }
    caches_1.RECENT_MESSAGES.insert(message);
    const reputation = calculateReputation(message);
    handleNewReputation(client, jail, author_member, message, reputation);
}
exports.antiSpamOnMessage = antiSpamOnMessage;
/**
 *
 */
function calculateReputation(message) {
    const author = message.author?.id;
    if (!author) {
        return (0, types_1.messageToAntiSpamMessage)(message);
    }
    const previous = (0, caches_1.getAntispamMessageByAuthorId)(author);
    if (!previous) {
        return (0, types_1.messageToAntiSpamMessage)(message);
    }
    // NOTE: use the current reputation for building the new object:
    const current = (0, types_1.messageToAntiSpamMessage)(message, previous.reputation);
    const delta = current.timestamp - previous.timestamp;
    // messages can be asynchronous, if we receive an older message than what we
    // already scanned then ignore:
    if (delta < 0) {
        return current;
    }
    const same_content = previous.content === current.content;
    const same_channel = previous.channel_id === current.channel_id;
    const has_link = current.content.includes("http://") || current.content.includes("https://");
    const one_second = 1000;
    const one_minute = 60 * one_second;
    const is_delta_normal = delta < one_minute;
    const is_delta_small = delta < 30 * one_second;
    const is_delta_small_very = delta < 10 * one_second;
    const is_delta_tiny = delta < one_second;
    if (same_content) {
        // the person is copy/pasting the same message:
        // -> not a big offense, but not great either
        current.reputation -= 1;
        if (!same_channel) {
            // copy/pasting but also accross multiple channels
            // -> it's starting to be spammy
            current.reputation -= 2;
            // without even waiting a bit between each copy
            if (is_delta_normal) {
                current.reputation -= 2;
            }
            // faster than a few seconds are certainly from bots:
            if (is_delta_small_very) {
                current.reputation -= 10;
            }
            if (is_delta_tiny) {
                current.reputation -= 100;
            }
        }
        if (message.mentions.users.size > 0) {
            current.reputation -= 2;
        }
        if (message.mentions.everyone) {
            current.reputation -= 100;
        }
    }
    if (!same_channel && has_link) {
        current.reputation -= 1;
        if (same_content) {
            current.reputation -= 1;
        }
    }
    if (!same_channel && is_delta_small) {
        current.reputation -= 1;
        if (is_delta_small_very) {
            current.reputation -= 2;
            if (is_delta_tiny) {
                current.reputation -= 3;
            }
        }
        if (message.mentions.users.size > 0) {
            current.reputation -= 1;
            // punish repetitive pings even more if previous message was already bad
            if (previous.tendency < 0) {
                current.reputation -= 1;
            }
        }
    }
    if (same_channel && !same_content) {
        // restore a bit of reputation on varied messages in same channels
        current.reputation += 1;
    }
    if (!same_content && is_delta_normal) {
        current.reputation += 1;
        if (same_channel) {
            current.reputation += 1;
        }
    }
    current.tendency = current.reputation - previous.reputation;
    return current;
}
async function handleNewReputation(client, jail, author, message, antispam) {
    if (!author.id) {
        return;
    }
    const previous = caches_1.ANTISPAM_MESSAGES.get(author.id);
    const previous_tendency = previous?.tendency ?? 0;
    const previous_reputation = previous?.reputation ?? 10;
    if (previous_reputation < 0) {
        message.delete().catch(console.error);
        return;
    }
    caches_1.ANTISPAM_MESSAGES.set(author.id, antispam);
    if (previous_tendency < 0 && antispam.tendency < 0) {
        (0, logging_1.log_reputation)(client, author, antispam);
    }
    if (antispam.reputation > 0) {
        if (antispam.tendency < -3) {
            message.delete().catch(console.error);
            (0, logging_1.log_reputation_message_deleted)(client, author, message);
        }
        return;
    }
    if (antispam.reputation < 0) {
        jail.restrict_message(message);
        (0, logging_1.log_reputation_user_shutdown)(client, author, message);
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

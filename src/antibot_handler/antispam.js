"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.antiSpamOnMessage = void 0;
const logging_1 = require("./logging");
const { BOT_ID, ADMIN_ROLE_ID, VERBOSE_BOT_ROLE } = require("../constants.js");
/**
 * stores the last message posted by people with information about the message
 * itself, like its content and when it was posted.
 */
const ANTISPAM_MESSAGES = new Map();
let last_cleanup = Date.now();
async function antiSpamOnMessage(client, jail, message) {
    const now = Date.now();
    if (now - last_cleanup > 1000 * 60) {
        last_cleanup = now;
        cleanupAntispamMessages();
    }
    const author_member = message.member || message.guild.members.cache.get(message.author.id);
    if (!author_member ||
        !author_member.id ||
        author_member.id === BOT_ID ||
        author_member.roles.cache.has(ADMIN_ROLE_ID)) {
        return;
    }
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
        return messageToAntiSpamMessage(message);
    }
    const previous = ANTISPAM_MESSAGES.get(author);
    if (!previous) {
        return messageToAntiSpamMessage(message);
    }
    // NOTE: use the current reputation for building the new object:
    const current = messageToAntiSpamMessage(message, previous.reputation);
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
    ANTISPAM_MESSAGES.set(author.id, antispam);
    if (antispam.tendency < 0) {
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
        ANTISPAM_MESSAGES.delete(author.id);
    }
}
function cleanupAntispamMessages() {
    const keys = ANTISPAM_MESSAGES.keys();
    const now = Date.now();
    const one_second = 1000;
    const one_minute = 60 * one_second;
    for (const key of keys) {
        const message = ANTISPAM_MESSAGES.get(key);
        if (!message) {
            continue;
        }
        const delta = now - message.timestamp;
        if (delta > one_minute * 10) {
            ANTISPAM_MESSAGES.delete(key);
        }
    }
}
function messageToAntiSpamMessage(message, reputation = 10) {
    return {
        content: message.content,
        timestamp: Date.now(),
        channel_id: message.channelId,
        reputation,
        tendency: 0,
    };
}

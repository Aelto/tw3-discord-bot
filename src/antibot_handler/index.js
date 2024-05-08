"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const active_users_1 = require("./active_users");
const antispam_1 = require("./antispam");
const jail_1 = require("./jail");
const { SHUT_ROLE, GRAVEYARD_CHANNEL_ID, ADMIN_ROLE_ID, } = require("../constants");
const { log_allow, log_ban, log_restrict } = require("./logging");
/**
 * Automatically deletes the messages of people without the basic role, then
 * assigns the author a restricted role and DMs instructions on how to remove
 * restrictions.
 * @todo A good improvement could be to migrate the JAIL.should_restrict logic
 * to the reputation system used by the anti-spam.
 * @param {Message} message
 * @param {Client} client
 */
exports.antibot_handler = async function (message, client) {
    if (message.client.user.id === message.author.id) {
        return;
    }
    await (0, antispam_1.antiSpamOnMessage)(client, jail_1.JAIL, message);
    (0, active_users_1.activeUserDetectionOnMessage)(message, client);
};
/**
 *
 * @param {Interaction} interaction
 */
exports.antibot_interaction_handler = async function (interaction, client) {
    if (interaction.customId.startsWith("allow_user;")) {
        const [id, uuid] = interaction.customId.split(";");
        const restricted = jail_1.JAIL.allow_user(uuid);
        if (restricted) {
            log_allow(client, restricted.user);
        }
    }
    else if (interaction.customId.startsWith("ban_user;")) {
        const [id, uuid] = interaction.customId.split(";");
        const restricted = jail_1.JAIL.ban_user(uuid);
        if (restricted) {
            log_ban(client, restricted.user);
        }
    }
};

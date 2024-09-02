"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.antibot_invite_create_handler = antibot_invite_create_handler;
const active_users_1 = require("./active_users");
const antispam_1 = require("./antispam");
const jail_1 = require("./jail");
const logging_1 = require("./logging");
const { SHUT_ROLE, GRAVEYARD_CHANNEL_ID, ADMIN_ROLE_ID, BASIC_ROLE, } = require("../constants");
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
async function antibot_invite_create_handler(invite) {
    const client = invite.client;
    const invite_guild = client.guilds.cache.get(invite.guild.id);
    console.log(invite_guild);
    const user = invite.inviter;
    const inviter = invite_guild?.members.cache.get(user.id);
    (0, logging_1.log_invite_created)(client, user, invite.channel);
    if (!inviter) {
        return;
    }
    if (!inviter.roles.cache.has(BASIC_ROLE)) {
        await invite.delete().catch(console.error);
        (0, logging_1.log_invite_from_non_hunter)(client, inviter);
    }
}

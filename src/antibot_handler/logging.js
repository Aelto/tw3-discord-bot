"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log_reputation_user_shutdown = exports.log_reputation_message_deleted = exports.log_reputation = exports.log_new_active_user_allowed = exports.log_new_active_user = void 0;
const Discord = require("discord.js");
const { ADMIN_CHANNEL_ID, LOG_CHANNEL_ID } = require("../constants");
function get_channel(client) {
    return client.channels.cache.get(ADMIN_CHANNEL_ID);
}
function get_channel_log(client) {
    return client.channels.cache.get(LOG_CHANNEL_ID);
}
/**
 *
 * @param {RestrictedUser} restricted_user
 */
exports.log_restrict = async function (client, restricted_user) {
    const row = new Discord.MessageActionRow().addComponents(new Discord.MessageButton()
        .setCustomId(`allow_user;${restricted_user.get_unique_id()}`)
        .setLabel("Allow")
        .setStyle("SUCCESS"), new Discord.MessageButton()
        .setCustomId(`ban_user;${restricted_user.get_unique_id()}`)
        .setLabel("Ban")
        .setStyle("DANGER"));
    const message = await get_channel(client)
        .send({
        content: `<@${restricted_user.user.id}> tried to send a link which was automatically deleted: \`${restricted_user.original_text_message}\``,
        components: [row],
    })
        .catch(console.error);
    restricted_user.link_to_logging_message(message);
};
/**
 *
 * @param {Discord.GuildMember} member
 */
exports.log_ban = function (client, member) {
    get_channel(client)
        .send(`<@${member.id}> was previously restricted and is now banned.`)
        .catch(console.error);
};
/**
 *
 * @param {Discord.GuildMember} member
 */
exports.log_allow = function (client, member) {
    get_channel(client)
        .send(`<@${member.id}> was previously restricted but is now free.`)
        .catch(console.error);
};
async function log_new_active_user(client, id) {
    const row = new Discord.MessageActionRow().addComponents(new Discord.MessageButton()
        .setCustomId(`active_user_allow;${id}`)
        .setLabel("Give role")
        .setStyle("SUCCESS"), new Discord.MessageButton()
        .setCustomId(`active_user_postpone;${id}`)
        .setLabel("Wait 3 more messages")
        .setStyle("SECONDARY"));
    await get_channel_log(client)
        .send({
        content: `<@${id}> has no role yet and has just recently started posting messages. What would you like to do?`,
        components: [row],
    })
        .catch(console.error);
}
exports.log_new_active_user = log_new_active_user;
async function log_new_active_user_allowed(client, id) {
    get_channel_log(client).send(`<@${id}> has been given his role`);
}
exports.log_new_active_user_allowed = log_new_active_user_allowed;
async function log_reputation(client, author, reputation) {
    get_channel_log(client).send(`<@${author.id}> reputation: ${reputation}`);
}
exports.log_reputation = log_reputation;
async function log_reputation_message_deleted(client, author, message) {
    get_channel_log(client).send(`A recent message from <@${author.id}> was deleted. **Reason**: Negative reputation tendency.\n\n**Message**:\n\`\`\`${message.content}\`\`\``);
}
exports.log_reputation_message_deleted = log_reputation_message_deleted;
async function log_reputation_user_shutdown(client, author, message) {
    get_channel_log(client).send(`A recent message from <@${author.id}> caused the user to be shutdown. **Reason**: Negative reputation.\n\n**Message**:\n\`\`\`${message.content}\`\`\``);
}
exports.log_reputation_user_shutdown = log_reputation_user_shutdown;

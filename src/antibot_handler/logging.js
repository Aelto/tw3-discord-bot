"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Discord = require("discord.js");
const RestrictedUser = require("./restricted_user");
const { ADMIN_CHANNEL_ID } = require("../constants");
function get_channel(client) {
    return client.channels.cache.get(ADMIN_CHANNEL_ID);
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

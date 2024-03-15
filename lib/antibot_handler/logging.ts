const Discord = require("discord.js");
const { ADMIN_CHANNEL_ID } = require("../constants");

function get_channel(client) {
  return client.channels.cache.get(ADMIN_CHANNEL_ID);
}

/**
 *
 * @param {RestrictedUser} restricted_user
 */
exports.log_restrict = async function (client, restricted_user) {
  const row = new Discord.MessageActionRow().addComponents(
    new Discord.MessageButton()
      .setCustomId(`allow_user;${restricted_user.get_unique_id()}`)
      .setLabel("Allow")
      .setStyle("SUCCESS"),
    new Discord.MessageButton()
      .setCustomId(`ban_user;${restricted_user.get_unique_id()}`)
      .setLabel("Ban")
      .setStyle("DANGER")
  );

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

export async function log_new_active_user(client, id: string) {
  const row = new Discord.MessageActionRow().addComponents(
    new Discord.MessageButton()
      .setCustomId(`active_user_allow;${id}`)
      .setLabel("Give role")
      .setStyle("SUCCESS"),
    new Discord.MessageButton()
      .setCustomId(`active_user_postpone;${id}`)
      .setLabel("Wait 3 more messages")
      .setStyle("SECONDARY")
  );

  await get_channel(client)
    .send({
      content: `<@${id}> has no role yet and has just recently started posting messages. What would you like to do?`,
      components: [row],
    })
    .catch(console.error);
}

export async function log_new_active_user_allowed(client, id: string) {
  get_channel(client).send(`<@${id}> has been given his role`);
}

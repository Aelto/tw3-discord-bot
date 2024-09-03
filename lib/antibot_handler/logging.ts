import { Channel, Client, GuildMember, Message, User } from "discord.js";
import { AntispamMessage } from "./antispam/types";

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
export async function log_restrict(client, restricted_user) {
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
}

/**
 *
 * @param {Discord.GuildMember} member
 */
export function log_ban(client, member) {
  get_channel(client)
    .send(`<@${member.id}> was previously restricted and is now banned.`)
    .catch(console.error);
}

/**
 *
 * @param {Discord.GuildMember} member
 */
export function log_allow(client, member) {
  get_channel(client)
    .send(`<@${member.id}> was previously restricted but is now free.`)
    .catch(console.error);
}

export async function log_new_active_user(
  client: Client,
  id: string,
  last_message_sent: string,
  last_channel_id: string
) {
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

  await get_channel_log(client)
    .send({
      content: `<@${id}> has no role yet and has just recently started posting messages, the most recent one being in <#${last_channel_id}>. What would you like to do?\n\n__**Last message sent**__:\`\`\`${last_message_sent}\`\`\``,
      components: [row],
    })
    .catch(console.error);
}

export async function log_new_active_user_allowed(client, id: string) {
  get_channel_log(client).send(`<@${id}> has been given his role`);
}

export async function log_reputation(
  client: Client,
  author: GuildMember,
  message: AntispamMessage
) {
  get_channel_log(client).send(
    `<@${author.id}>, <#${message.channel_id}>, reputation: ${message.reputation}, tendency: ${message.tendency}\n\n**Message**:\n\`\`\`${message.content}\`\`\``
  );
}

export async function log_reputation_message_deleted(
  client: Client,
  author: GuildMember,
  message: Message
) {
  get_channel_log(client).send(
    `A recent message from <@${author.id}> in <#${message.channelId}> was deleted. **Reason**: Negative reputation tendency.\n\n**Message**:\n\`\`\`${message.content}\`\`\``
  );
}

export async function log_reputation_user_shutdown(
  client: Client,
  author: GuildMember,
  message: Message
) {
  get_channel_log(client).send(
    `A recent message from <@${author.id}> in <#${message.channelId}> caused the user to be shutdown. **Reason**: Negative reputation.\n\n**Message**:\n\`\`\`${message.content}\`\`\``
  );
}

export async function log_message_from_jailed(
  client: Client,
  message: Message
) {
  get_channel_log(client).send(
    `A recent message from <@${message.author.id}> in <#${message.channelId}> was deleted. **Reason**: Already jailed.\n\n**Message**:\n\`\`\`${message.content}\`\`\``
  );
}

export async function log_invite_created(
  client: Client,
  user: User,
  channel: Channel
) {
  get_channel_log(client).send(
    `Member <@${user.id}> created an invite for <#${channel.id}>`
  );
}

export async function log_invite_from_non_hunter(
  client: Client,
  member: GuildMember
) {
  get_channel_log(client).send(
    `Member <@${member.id}> created an invite but was lacking the basic roles, invite was automatically deleted.`
  );
}

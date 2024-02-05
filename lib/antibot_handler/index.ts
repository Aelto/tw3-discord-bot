import { cacheNewActiveUser, isNewActiveUser } from "./active_users";

const { Client, Message, Interaction } = require("discord.js");
const {
  SHUT_ROLE,
  GRAVEYARD_CHANNEL_ID,
  ADMIN_ROLE_ID,
  ADMIN_CHANNEL_ID,
} = require("../constants");

const JAIL = require("./jail.js");
const { log_allow, log_ban, log_restrict } = require("./logging");

/**
 * Automatically deletes the messages of people without the basic role, then
 * assigns the author a restricted role and DMs instructions on how to remove
 * restrictions.
 * @param {Message} message
 * @param {Client} client
 */
exports.antibot_handler = async function (message, client) {
  if (message.client.user.id === message.author.id) {
    return;
  }

  if (JAIL.should_restrict(message)) {
    const restricted_user = JAIL.restrict_message(message);

    await message.guild.channels.cache.get(GRAVEYARD_CHANNEL_ID).send(
      `
Hi <@${message.author.id}>,

This is an automated response to the message(s) you just sent in this server. The message contained a link, however only users with the Hunter role can send links. For this reason you are now <@&${SHUT_ROLE}> which means you will have to contact a <@&${ADMIN_ROLE_ID}> to gain back access to the server.

Thanks for your understanding.`.trim()
    );

    log_restrict(client, restricted_user);
  }

  if (isNewActiveUser(message)) {
    cacheNewActiveUser(message, client);
  }
};

/**
 *
 * @param {Interaction} interaction
 */
exports.antibot_interaction_handler = async function (interaction, client) {
  if (interaction.customId.startsWith("allow_user;")) {
    const [id, uuid] = interaction.customId.split(";");

    const restricted = JAIL.allow_user(uuid);
    if (restricted) {
      log_allow(client, restricted.user);
    }
  } else if (interaction.customId.startsWith("ban_user;")) {
    const [id, uuid] = interaction.customId.split(";");

    const restricted = JAIL.ban_user(uuid);
    if (restricted) {
      log_ban(client, restricted.user);
    }
  }
};

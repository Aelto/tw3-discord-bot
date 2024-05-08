import { activeUserDetectionOnMessage } from "./active_users";
import { antiSpamOnMessage } from "./antispam";
import { JAIL } from "./jail";

const {
  SHUT_ROLE,
  GRAVEYARD_CHANNEL_ID,
  ADMIN_ROLE_ID,
} = require("../constants");

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

  await antiSpamOnMessage(client, JAIL, message);
  activeUserDetectionOnMessage(message, client);
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

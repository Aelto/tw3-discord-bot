import { Client, Invite } from "discord.js";
import { activeUserDetectionOnMessage } from "./active_users";
import { JAIL } from "./jail";
import {
  log_allow,
  log_ban,
  log_invite_created,
  log_invite_from_non_hunter,
} from "./logging";
import { antiSpamOnMessage } from "./antispam";
import { BASIC_ROLE } from "../constants";

/**
 * Automatically deletes the messages of people without the basic role, then
 * assigns the author a restricted role and DMs instructions on how to remove
 * restrictions.
 * @todo A good improvement could be to migrate the JAIL.should_restrict logic
 * to the reputation system used by the anti-spam.
 * @param {Message} message
 * @param {Client} client
 */
export async function antibot_handler(message, client) {
  if (client.user.id === message.author.id) {
    return;
  }

  await antiSpamOnMessage(client, message).catch(console.log);
  activeUserDetectionOnMessage(message, client);
}

/**
 *
 * @param {Interaction} interaction
 */
export async function antibot_interaction_handler(interaction, client) {
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
}

export async function antibot_invite_create_handler(invite: Invite) {
  const client = invite.client;
  const invite_guild = client.guilds.cache.get(invite.guild.id);

  const user = invite.inviter;
  const inviter = invite_guild?.members.cache.get(user.id);

  log_invite_created(client, user, invite.channel);

  if (!inviter) {
    return;
  }

  if (!inviter.roles.cache.has(BASIC_ROLE)) {
    await invite.delete().catch(console.error);
    log_invite_from_non_hunter(client, inviter);
  }
}

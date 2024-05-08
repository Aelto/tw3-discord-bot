import { Message } from "discord.js";
import CACHE from "./cache";
import { NewActiveUser } from "./active_user";
import { log_new_active_user_allowed } from "../logging";
import { guildMemberFromMessage } from "../../discord_utils";
const { WELCOME_CHANNEL_ID } = require("../../constants");

export function activeUserDetectionOnMessage(message: Message, client) {
  if (isNewActiveUser(message)) {
    onNewActiveUser(message, client);
  }
}

function isNewActiveUser(message: Message): boolean {
  // exclude messages from the welcome channel
  if (message.channelId === WELCOME_CHANNEL_ID) {
    return false;
  }

  const author_member = guildMemberFromMessage(message);

  // because there is the @everyone role
  return (author_member?.roles?.cache?.size ?? 2) <= 1;
}

function onNewActiveUser(message: Message, client) {
  const author_member = guildMemberFromMessage(message);

  if (!author_member) {
    return;
  }

  if (!CACHE.increaseMemberHit(author_member, client)) {
    const active_user = new NewActiveUser(author_member, client);
    CACHE.addMember(active_user);
  }

  CACHE.setLastMessageSent(author_member, message);
}

export async function activeUserInteractionHandler(interaction, client) {
  if (interaction.customId.startsWith("active_user_allow;")) {
    const [id, member_id] = interaction.customId.split(";");

    const user = CACHE.getMember(member_id);
    if (user) {
      user.allow_user();
      log_new_active_user_allowed(client, member_id);

      CACHE.deleteMember(member_id);
    }
  } else if (interaction.customId.startsWith("active_user_postpone;")) {
    const [id, member_id] = interaction.customId.split(";");

    const user = CACHE.getMember(member_id);
    if (user) {
      user.increaseHitGoal(client);
    }
  }
}

import { Message } from "discord.js";
import CACHE from "./cache";
import { NewActiveUser } from "./active_user";
import { log_new_active_user_allowed } from "../logging";

export function isNewActiveUser(message: Message) {
  const author_member = message.member || message.guild.members.cache.get(message.author.id);

  return author_member.roles.cache.size <= 1; // because there is the @everyone role
}

export function cacheNewActiveUser(message: Message, client) {
  const author_member = message.member || message.guild.members.cache.get(message.author.id);
  
  if (!CACHE.increaseMemberHit(author_member, client)) {
    const active_user = new NewActiveUser(author_member, client);
    CACHE.addMember(active_user);
  }
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
  }
  else if (interaction.customId.startsWith("active_user_postpone;")) {
    const [id, member_id] = interaction.customId.split(";");

    const user = CACHE.getMember(member_id);
    if (user) {
      user.increaseHitGoal(client);
    }
  }
};
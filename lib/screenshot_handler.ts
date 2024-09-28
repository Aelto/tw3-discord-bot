import { MessageReaction, PartialUser, Client, EmbedBuilder } from "discord.js";
import { DeferredSet } from "./datatypes/deferred-set";
import {
  SCREENSHOT_CHANNEL_ID,
  SCREENSHOT_REPOST_CHANNEL_ID,
} from "./constants";

/**
 * the amount of reactions from unique users needed for a repost
 */
const number_of_unique_votes = 4;
const debouncer = new DeferredSet(10, 10);

module.exports = function addScreenshotHandler(client: Client) {
  client.on(
    "messageReactionAdd",
    async (reaction: MessageReaction, user: PartialUser) => {
      if (reaction.me || user.bot) {
        return;
      }

      if (reaction.message.channel.id !== SCREENSHOT_CHANNEL_ID) {
        return;
      }

      if (reaction.partial) {
        // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
        try {
          await reaction.fetch();
        } catch (error) {
          console.error(
            "Something went wrong when fetching the message:",
            error
          );

          return;
        }
      }

      debouncer.set(reaction.message.id, () =>
        onReactionAdded(client, reaction, user)
      );
    }
  );
};

async function onReactionAdded(
  client: Client,
  reaction: MessageReaction,
  user: PartialUser
) {
  const reactions = Array.from(reaction.message.reactions.cache.values());

  const sync_users = reactions.map((reaction) =>
    Array.from(reaction.users.cache.values())
  );

  const reactions_users = await Promise.all(
    reactions.map((reaction) => reaction.users.fetch())
  );

  const users = reactions_users
    .map((users_collection) => Array.from(users_collection.values()))
    .concat(sync_users)
    .flatMap((user) => user)
    .map((user) => user.id);

  const unique_users = Array.from(new Set(users));

  const already_has_bot_reaction = unique_users.some(
    (user) => user === client.user.id
  );

  if (already_has_bot_reaction) {
    return;
  }

  if (unique_users.length < number_of_unique_votes) {
    return;
  }

  const message = reaction.message;

  await message.react("📸");
  const { attachments } = message;
  const repost_channel = message.client.channels.cache.get(
    SCREENSHOT_REPOST_CHANNEL_ID
  );

  for (const image of Array.from(attachments.values())) {
    if (!image) {
      continue;
    }

    const contains_spoiler = image.name.toLowerCase().includes("spoiler_");

    if (contains_spoiler) {
      continue;
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: message.content || message.author.username,
      })
      .setDescription(`[by ${message.author.username}](${message.url})`)
      .setColor(3066993)
      .setTimestamp(new Date())
      .setImage(image.url)
      .setFooter({
        text: message.author.username,
      });

    //@ts-ignore
    repost_channel.send({ embeds: [embed] }).catch(console.error);
  }
}

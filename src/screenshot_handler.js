const Discord = require('discord.js');
const { SCREENSHOT_CHANNEL_ID, SCREENSHOT_REPOST_CHANNEL_ID } = require('./constants');

/**
 * the amount of reactions from unique users needed for a repost
 */
const number_of_unique_votes = 4;

module.exports = function addScreenshotHandler(client) {
  client.on('messageReactionAdd', async (reaction, _user) => {
    // when the reaction is from the bot
    if (reaction.me) {
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
        console.error('Something went wrong when fetching the message:', error);

        return;
      }
    }

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

    if (unique_users.length < number_of_unique_votes) {
      return;
    }

    const message = reaction.message;

    await message.react('📸');
    const { attachments } = message;
    const repost_channel = message.client.channels.cache.get(
      SCREENSHOT_REPOST_CHANNEL_ID
    );

    for (const image of Array.from(attachments.values())) {
      if (!image) {
        continue;
      }

      const contains_spoiler = image.name.toLowerCase().includes('spoiler_');

      if (contains_spoiler) {
        continue;
      }

      const embed = new Discord.MessageEmbed()
        .setAuthor({
          name: message.content,
          icon_url: message.author.avatarURL,
        })
        .setDescription(`[by ${message.author.username}](${message.url})`)
        .setColor(3066993)
        .setTimestamp(new Date())
        .setImage(image.url)
        .setFooter({
          icon_url: message.author.avatarURL,
          text: message.author.username,
        });

      repost_channel.send({ embeds: [embed] }).catch(console.error);
    }
  });
};

const {
  SCREENSHOT_CHANNEL_ID,
  SCREENSHOT_REPOST_CHANNEL_ID,
  ADMIN_ROLE_ID,
  BOT_ID,
  LOG_CHANNEL_ID
} = require('./constants');
const { Client, Message, MessageReaction, User } = require('discord.js');

/**
 * 
 * @param {MessageReaction} reaction 
 * @param {User} user 
 * @returns 
 */
function reactionFilter(reaction, user) {
  return !user.bot;
}

const one_second = 1000;
const one_minute = one_second * 60;
const one_hour = one_minute * 60;

/**
 * 
 * @param {Message} message 
 */
function addScreenshotReactionListener(message) {

  if (message.channel.id !== SCREENSHOT_CHANNEL_ID) {
    return;
  }

  const attachments = message.attachments.array();
  if (!attachments.length) {
    return;
  }

  const number_of_unique_votes = 4;
  const inactivity_time_before_delete = one_hour * 24;
  message.awaitReactions(reactionFilter, { maxUsers: number_of_unique_votes, dispose: true, idle: inactivity_time_before_delete, errors: ['time'] })
    .then(async collected => {
      const collected_users = Array.from(
        new Set(
          collected.array()
          .map(reaction => Array.from(reaction.users.cache.values()))
          .flatMap(user => user)
        )
      );

      if (collected_users.length < number_of_unique_votes) {
        return;
      }

      const last_reaction = collected.last();
      const { message } = last_reaction;

      await  message.react('📸');
      const { attachments } = message;

      const repost_channel = message.client.channels.cache.get(SCREENSHOT_REPOST_CHANNEL_ID);

      for (const image of attachments.array()) {
        if (!image) {
          continue;
        }

        repost_channel.send('', {
          embed: {
            author: {
              name: last_reaction.message.content,
              icon_url: last_reaction.message.author.avatarURL
            },
            // title: ,
            description: `[by ${last_reaction.message.author.username}](${last_reaction.message.url})`,
            color: 3066993,
            timestamp: new Date(),
            image: image,
            footer: {
              icon_url: last_reaction.message.author.avatarURL,
              text: last_reaction.message.author.username
            }
          }
        });

        // await repost_channel.send(`by ${reaction.message.author.username}`);
        // await repost_channel.send(image.url);
      }
    })
    .catch(collected => {});
}

module.exports = addScreenshotReactionListener;
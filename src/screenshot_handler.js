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

  const number_of_unique_votes = 3;
  const inactivity_time_before_delete = one_hour * 24;
  message.awaitReactions(reactionFilter, { maxUsers: number_of_unique_votes, dispose: true, idle: inactivity_time_before_delete, errors: ['time'] })
    .then(async collected => {
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

/**
 * 
 * @param {Client} client 
 */
function setupScreenshotChannelHandler(client) { // screenshot channel reaction handler
  const channel = client.channels.cache.get(SCREENSHOT_CHANNEL_ID);
  const repost_channel = client.channels.cache.get(SCREENSHOT_REPOST_CHANNEL_ID);
  const log_channel = client.channels.cache.get(LOG_CHANNEL_ID);

  const log = (reaction, text) => log_channel.send('', {
    embed: {
      author: {
        name: reaction.message.author.username,
        icon_url: reaction.message.author.avatarURL
      },
      title: 'log',
      description: `[${text}](${reaction.message.url})`,
      color: 15158332,
      timestamp: new Date(),
      footer: {
        icon_url: reaction.message.author.avatarURL,
        text: reaction.message.author.username
      }
    }
  });

  if (!channel) {
    const admin_channel = client.channels.cache.get(ADMIN_CHANNEL_ID);

    if (admin_channel) {
      admin_channel.send("The ID of the screenshot channel that is passed is invalid and doesn't link to anything. The screenshot feature is now disabled");
    }

    return;
  }

  channel.client.on('messageReactionAdd', async (reaction, user) => {
    // console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`);
    // console.log(`${reaction.count} user(s) have given the same reaction to this message!`);

    if (user.bot || reaction.message.channel.id !== SCREENSHOT_CHANNEL_ID) {
      return;
    }

    if (!repost_channel) {
      reaction.message.channel.send(`ERROR: <@&${ADMIN_ROLE_ID}>, could not get the repost channel from its id: ${SCREENSHOT_REPOST_CHANNEL_ID}`);

      return;
    }

    if (reaction.count < 3) {
      await log(reaction, `less than 3 reactions ${reaction.emoji.name}, count: ${reaction.count}. Fetching message`);
      const message = await reaction.message.fetch();

      const reactions = Array.from(reaction.message.reactions.cache.values());
      const is_there_valid_reaction = reactions.some(reaction => reaction.count >= 3);

      if (!is_there_valid_reaction) {
        await log(reaction, `after fetch: less than 3 reactions ${reaction.emoji.name}, count: ${reaction.count}.`);
        return;
      }
    }

    const { attachments } = reaction.message;

    const has_bot_reacted = Array.from(reaction.message.reactions.cache.values())
      .some(reaction => reaction.users.cache.get(BOT_ID));

    // to know if the image was already reposted, we make the bot react to the
    // mesasge. And then for reaction we check if the bot already reacted,
    // if it did we now know it was already reposted.
    if (has_bot_reacted) {
      log(reaction, 'bot already reacted');
      return;
    }

    await reaction.message.react('📸');

    for (const image of attachments.array()) {
      if (!image) {
        await log(reaction, 'no image in message');
        continue;
      }

      repost_channel.send('', {
        embed: {
          author: {
            name: reaction.message.content,
            icon_url: reaction.message.author.avatarURL
          },
          // title: ,
          description: `[by ${reaction.message.author.username}](${reaction.message.url})`,
          color: 3066993,
          timestamp: new Date(),
          image: image,
          footer: {
            icon_url: reaction.message.author.avatarURL,
            text: reaction.message.author.username
          }
        }
      });

      // await repost_channel.send(`by ${reaction.message.author.username}`);
      // await repost_channel.send(image.url);
    }
    
  });
}

module.exports = addScreenshotReactionListener;
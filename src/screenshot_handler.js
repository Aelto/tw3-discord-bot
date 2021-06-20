const {
  SCREENSHOT_CHANNEL_ID,
  SCREENSHOT_REPOST_CHANNEL_ID,
  ADMIN_ROLE_ID,
  BOT_ID
} = require('./constants');
const { Client } = require('discord.js');

/**
 * 
 * @param {Client} client 
 */
function setupScreenshotChannelHandler(client) { // screenshot channel reaction handler
  const channel = client.channels.cache.get(SCREENSHOT_CHANNEL_ID);
  const repost_channel = client.channels.cache.get(SCREENSHOT_REPOST_CHANNEL_ID);

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

    if (user.id === BOT_ID || reaction.message.channel.id !== SCREENSHOT_CHANNEL_ID) {
      return;
    }

    if (!repost_channel) {
      reaction.message.channel.send(`ERROR: <@&${ADMIN_ROLE_ID}>, could not get the repost channel from its id: ${SCREENSHOT_REPOST_CHANNEL_ID}`);

      return;
    }

    if (reaction.count >= 3) {
      const { attachments } = reaction.message;

      const has_bot_reacted = Array.from(reaction.message.reactions.cache.values())
        .some(reaction => reaction.users.cache.get(BOT_ID));

      // to know if the image was already reposted, we make the bot react to the
      // mesasge. And then for reaction we check if the bot already reacted,
      // if it did we now know it was already reposted.
      if (has_bot_reacted) {
        return;
      }

      await reaction.message.react('📸');

      for (const image of attachments.array()) {
        if (!image) {
          continue;
        }
  
        await repost_channel.send(`by ${reaction.message.author.username}`);
        await repost_channel.send(image.url);
      }
      
    }
  });
}

module.exports = setupScreenshotChannelHandler;
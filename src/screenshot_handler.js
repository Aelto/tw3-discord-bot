const {
  SCREENSHOT_CHANNEL_ID,
  SCREENSHOT_REPOST_CHANNEL_ID,
  ADMIN_ROLE_ID
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
    return;
  }

  channel.client.on('messageReactionAdd', async (reaction, user) => {
    // console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`);
    // console.log(`${reaction.count} user(s) have given the same reaction to this message!`);

    if (!repost_channel) {
      reaction.message.channel.send(`ERROR: <@&${ADMIN_ROLE_ID}>, could not get the repost channel from its id: ${SCREENSHOT_REPOST_CHANNEL_ID}`);

      return;
    }

    if (reaction.count > 2) {
      const { attachments } = reaction.message;
      const [image] = attachments.array();
      
      if (!image) {
        return;
      }

      repost_channel.send('', {
        embed: {
          author: {
            name: user.username,
            icon_url: user.avatarURL
          },
          // title: `Screenshot by ${user.username}`,
          // description: "",
          color: 3447003, // blue
          image: image,
          timestamp: new Date(),
          footer: {
            icon_url: user.avatarURL,
            text: user.username
          }
        }
      });
    }
  });
}

module.exports = setupScreenshotChannelHandler;
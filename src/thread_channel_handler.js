const { Client, Message, MessageReaction, User } = require('discord.js');
const { THREAD_CHANNEL_ID, THREAD_CHANNEL_ROLE_ID } = require('./constants');

const defer_channels = new Map();
const notified_authors = new Set();

let interval_id = null;

function defer_action(message, client) {
  defer_channels.set(message.author.id, {
    message,
    client,
    insert_date: Date.now()
  });

  if (interval_id !== null) {
    return;
  }

  interval_id = setInterval(async () => {
    const keys = Array.from(defer_channels.keys());

    if (keys.length === 0) {
      clearInterval(interval_id);

      interval_id = null;

      return;
    }

    for (const author_id of keys) {
      const { message, client, insert_date, bot_message = null } = defer_channels.get(author_id);

      const one_second = 1000;
      if (Date.now() - insert_date > one_second * 30 && !notified_authors.has(author_id)) {
        notified_authors.add(author_id);

        const bot_message = await message.reply(`Thank you <@${author_id}>! A thread will be created automatically in 30 seconds`);
        defer_channels.set(author_id, {
          message,
          client,
          insert_date,
          bot_message
        });

        continue;
      }
  
      if (Date.now() - insert_date < one_second * 60) {
        continue;
      }

      defer_channels.delete(author_id);
      notified_authors.delete(author_id);

      await message.channel.threads
        .create({
          name: message.author.username,
          autoArchiveDuration: 60 * 24,
          startMessage: message
        });

      if (bot_message !== null) {
        bot_message.delete();
      }
    }
  }, 1000);
}

/**
 * this module is everything about the "thread channel", it's a channel where
 * only people with a specific role can post messages. Whenever one of these
 * person posts a message, after a small delay a thread is automatically created
 * @param {Message} message 
 * @param {Client} client
 */
module.exports = async function thread_channel_handler(message, client) {
  if (message.channel.id !== THREAD_CHANNEL_ID) {
    return;
  }

  // when the message if from the bot
  if (message.author.id === client.user.id) {
    return;
  }

  const author_member = message.guild.members.cache.get(message.author.id);
  const has_thread_channel_role = author_member && author_member.roles.cache.has(THREAD_CHANNEL_ROLE_ID);

  if (!has_thread_channel_role) {
    await message.delete();

    return;
  }

  defer_action(message, client);
}
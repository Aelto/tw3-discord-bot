const { THREAD_CHANNEL_ID, THREAD_CHANNEL_ROLE_ID } = require("./constants");

const NO_THREAD_MESSAGE = "Thank you";

const defer_channels = new Map();
const notified_authors = new Set();

let interval_id = null;

function defer_action(message, client) {
  defer_channels.set(message.author.id, {
    message,
    client,
    insert_date: Date.now(),
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
      const {
        message,
        client,
        insert_date,
        bot_message = null,
      } = defer_channels.get(author_id);

      const one_second = 1000;
      if (
        Date.now() - insert_date > one_second * 60 &&
        !notified_authors.has(author_id)
      ) {
        notified_authors.add(author_id);

        const bot_message = await message
          .reply(
            `
Thank you <@${author_id}>! A thread will be created automatically in 60 seconds.
Note that any new message you will post before the thread is created will be used for the thread instead of the original one.

If you are wondering what this is all about, please read the description of the channel.
__If you wish your message to stay without a thread, write \`${NO_THREAD_MESSAGE}\`.__

_This message will be deleted automatically during the creation of the thread_
        `.trim()
          )
          .catch(console.error);

        defer_channels.set(author_id, {
          message,
          client,
          insert_date,
          bot_message,
        });

        continue;
      }

      if (Date.now() - insert_date < one_second * 5) {
        continue;
      }

      defer_channels.delete(author_id);
      notified_authors.delete(author_id);

      await message.channel.threads
        .create({
          name: message.author.username,
          autoArchiveDuration: 60 * 24,
          startMessage: message,
        })
        .catch(console.error);

      if (bot_message !== null) {
        bot_message.delete().catch(console.error);
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
  const has_thread_channel_role =
    author_member && author_member.roles.cache.has(THREAD_CHANNEL_ROLE_ID);

  if (!has_thread_channel_role) {
    await message.delete().catch(console.error);

    return;
  }

  if (
    message.content
      .toLocaleLowerCase()
      .includes(NO_THREAD_MESSAGE.toLocaleLowerCase())
  ) {
    const author_id = message.author.id;
    const some_defered_channel = defer_channels.get(author_id);

    defer_channels.delete(author_id);
    notified_authors.delete(author_id);

    if (some_defered_channel) {
      const { bot_message = null } = defer_channels.get(author_id);

      if (bot_message !== null) {
        bot_message.delete().catch(console.error);
      }
    }

    return;
  }

  defer_action(message, client);
};

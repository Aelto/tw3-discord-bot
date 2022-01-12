const { Client, Message, MessageReaction, User } = require('discord.js');
const { BASIC_ROLE, SHUT_ROLE, GRAVEYARD_CHANNEL_ID, ADMIN_ROLE_ID, ADMIN_CHANNEL_ID } = require('./constants');

/**
 * Automatically deletes the messages of people without the basic role, then
 * assigns the author a restricted role and DMs instructions on how to remove
 * restrictions.
 * @param {Message} message 
 * @param {Client} client
 */
module.exports = async function antibot_handler(message, client) {
  if (message.client.user.id === message.author.id) {
    return;
  }

  const allowed_domains = [
    'nexusmods.com',
    'imgur.com',
    'reddit.com',
    'spotify.com',
    'pastebin.com',
    'github.com',
    'tenor.com',
    'youtube.com',
    'github.io'
  ];

  const contains_link = (
    message.content.includes('http://')
    || message.content.includes('https://')
  );

  // NOTE: there is a flaw with this implementation that i don't think is too
  // important for the moment, but it is worth mentioning:
  // if a message contains two links, one is allowed and the other is not,
  // the message will go through without any issue.
  const contains_allowed_domain = allowed_domains
    .some(domain => message.content.includes(domain));

  if (contains_link && !contains_allowed_domain) {
    const author_member = message.guild.members.cache.get(message.author.id);
    const has_shut_role = author_member && author_member.roles.cache.has(SHUT_ROLE);
    const has_any_role = author_member && has_shut_role
      ? author_member.roles.cache.size > 2
      : author_member.roles.cache.size > 1; // 1 because there is the @everyone role

    const contains_word_nitro = message.content.includes('nitro');

    if (has_shut_role || !has_any_role || contains_word_nitro) {
      try {
        await author_member.roles.add(SHUT_ROLE);

        if (!has_shut_role) {
          await author_member.guild.channels.cache.get(GRAVEYARD_CHANNEL_ID).send(`
Hi <@${message.author.id}>,

This is an automated response to the message(s) you just sent in this server.
The message contained a link, however only users with the Hunter role can send links.

For this reason you are now <@&${SHUT_ROLE}> which means you will have to contact a <@&${ADMIN_ROLE_ID}> to
gain back access to the server.

Thanks for your understanding.`.trim());
        }

        await message.delete();
      }
      catch (err) {
        console.log(err);
      }

      try {
        const log_channel = client.channels.cache.get(ADMIN_CHANNEL_ID);

        log_channel.send(`<@${message.author.id}> tried to send a link which was automatically deleted: \`${message.content}\``)
        .catch(console.error);
      }
      catch (err) {

      }
    }
  }
}
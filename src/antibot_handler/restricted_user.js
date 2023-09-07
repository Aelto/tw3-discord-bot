const Discord = require("discord.js");
const { SHUT_ROLE, BASIC_ROLE } = require("../constants");

module.exports = class RestrictedUser {
  /**
   *
   * @param {Discord.Message} message
   */
  constructor(message) {
    this.original_message = message;

    /**
     * @type {string}
     */
    this.original_text_message = message.content;

    /**
     * @type {Discord.TextChannel}
     */
    this.message_channel = message.channel;

    /**
     * @type {Discord.GuildMember}
     */
    this.user = message.guild.members.cache.get(message.author.id);

    this.creation_date = new Date();
    this.unique_id = `${this.user.id}-${message.id}-${Math.random()}`;

    this.restrict_user(message.client);
    message.delete().catch(console.error);
  }

  get_unique_id() {
    return this.unique_id;
  }

  async restrict_user() {
    await this.user.roles.add(SHUT_ROLE).catch(console.error);
  }

  /**
   *
   * @param {Discord.Message} message
   */
  link_to_logging_message(message) {
    this.logging_message = message;
  }

  delete_logging_message() {
    if (this.logging_message) {
      this.logging_message.delete().catch(console.error);
    }
  }

  allow_user() {
    this.user.roles.remove(SHUT_ROLE).catch(console.error);
    this.user.roles.add(BASIC_ROLE).catch(console.error);

    this.original_message.channel
      .send(
        `
__**<@${this.user.id}>, an update on the previous ping you received:**__
Your message was detected as potentially dangerous and in the meantime you were given a restricting role to secure the server.

The peacekeepers decided it was safe and manually gave you the correct roles, allowing you to freely visit & discuss in the server.
Sorry for the inconvenience!

__Below is the content of your previous message:__
${this.original_text_message}`.trim()
      )
      .catch(console.error);

    this.delete_logging_message();
  }

  ban_user() {
    this.user.ban().catch(console.error);

    this.delete_logging_message();
  }
};

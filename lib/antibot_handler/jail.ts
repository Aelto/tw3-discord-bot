import { Message } from "discord.js";

const Discord = require("discord.js");

const RestrictedUser = require("./restricted_user");
const allowed_domains = require("./allowed_domains");
const { SHUT_ROLE } = require("../constants");

/**
 * Holds the recently restricted users so the bot can perform actions on them
 * based on events fired by the administrators.
 */
class Jail {
  /**
   * A collection of restricted users paired with a unique ID that corresponds
   * to the user and the restricted message.
   * @type {}
   */
  jail: Map<string, typeof RestrictedUser>;
  constructor() {
    this.jail = new Map();
  }

  should_restrict(message: Message) {
    const contains_link =
      message.content.includes("http://") ||
      message.content.includes("https://");

    if (!contains_link) {
      return false;
    }

    // NOTE: there is a flaw with this implementation that i don't think is too
    // important for the moment, but it is worth mentioning:
    // if a message contains two links, one is allowed and the other is not,
    // the message will go through without any issue.
    const contains_allowed_domains = allowed_domains.every((domain) =>
      message.content.includes(domain)
    );

    if (contains_allowed_domains) {
      return false;
    }

    const author_member = message.member || message.guild.members.cache.get(message.author.id);
    const has_shut_role =
      author_member && author_member.roles.cache.has(SHUT_ROLE);

    const has_any_role =
      author_member && has_shut_role
        ? author_member.roles.cache.size > 2
        : author_member.roles.cache.size > 1; // 1 because there is the @everyone role

    const contains_word_nitro = message.content.includes("nitro");

    return has_shut_role || !has_any_role || contains_word_nitro;
  }

  /**
   *
   * @param {Discord.Message} message
   */
  restrict_message(message) {
    const restricted = new RestrictedUser(message);
    const uuid = restricted.get_unique_id();

    this.jail.set(uuid, restricted);

    return restricted;
  }

  allow_user(uuid) {
    const user = this.jail.get(uuid);

    if (user) {
      user.allow_user();
      this.jail.delete(uuid);
    }

    return user;
  }

  ban_user(uuid) {
    const user = this.jail.get(uuid);

    if (user) {
      user.ban_user();
      this.jail.delete(uuid);
    }

    return user;
  }

  /**
   * Flushes the memory of restricted users, this doesn't mean the users are
   * banned or restricted but simply the jail clears its memory.
   */
  flush() {
    this.jail.clear();
  }
}

module.exports = new Jail();
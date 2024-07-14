import { Message } from "discord.js";
import { RestrictedUser } from "./restricted_user";

const allowed_domains: string[] = require("./allowed_domains");
const { SHUT_ROLE, ADMIN_ROLE_ID } = require("../constants");

/**
 * Holds the recently restricted users so the bot can perform actions on them
 * based on events fired by the administrators.
 */
export class Jail {
  /**
   * A collection of restricted users paired with a unique ID that corresponds
   * to the user and the restricted message.
   * @type {}
   */
  jail: Map<string, RestrictedUser>;
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

    const slice = " " + message.content.replace("http://", "https://") + " ";
    const urls = [...slice.matchAll(/https?:\/\/.*?\s/g)];
    const contains_allowed_domains = urls.map(([url]) =>
      allowed_domains.some((domain) => url.includes(domain))
    );

    if (contains_allowed_domains) {
      return false;
    }

    const author_member =
      message.member || message.guild.members.cache.get(message.author.id);
    const has_shut_role =
      author_member && author_member.roles.cache.has(SHUT_ROLE);

    const has_any_role =
      author_member && has_shut_role
        ? author_member.roles.cache.size > 2
        : author_member.roles.cache.size > 1; // 1 because there is the @everyone role

    const contains_word_nitro = message.content.includes("nitro");

    const pinged_everyone = message.content.includes("@everyone");
    const is_admin = author_member.roles.cache.has(ADMIN_ROLE_ID);

    return (
      has_shut_role ||
      !has_any_role ||
      contains_word_nitro ||
      (pinged_everyone && !is_admin)
    );
  }

  restrict_message(message: Message) {
    const restricted = new RestrictedUser(message);
    const uuid = restricted.get_unique_id();

    this.jail.set(uuid, restricted);

    this.remove_outdated_jailed_users();

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

  is_jailed(message: Message) {
    for (const user of this.jail.values()) {
      if (user.user.id == message.author.id) {
        return true;
      }
    }

    return false;
  }

  /**
   * Flushes the memory of restricted users, this doesn't mean the users are
   * banned or restricted but simply the jail clears its memory.
   */
  remove_outdated_jailed_users() {
    const to_delete = Array.from(this.jail.keys()).filter((key) =>
      this.jail.get(key).can_be_deleted()
    );

    for (const key of to_delete) {
      this.jail.delete(key);
    }
  }
}

export const JAIL = new Jail();

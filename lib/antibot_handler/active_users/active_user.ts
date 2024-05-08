import { GuildMember } from "discord.js";
import { log_new_active_user } from "../logging";

const { BASIC_ROLE } = require("../../constants");

/**
 * Represent a new but active user that may require some attention to get his
 * basic roles set up.
 */
export class NewActiveUser {
  public id: string;
  public creation_date: number;
  private member: GuildMember;
  private last_message_sent: string;

  /**
   * represents the amount of messages since the member has been created noticed
   */
  private hit: number;
  private hit_goal: number;

  constructor(member: GuildMember, client) {
    this.id = member.id;
    this.creation_date = Date.now();
    this.member = member;
    this.hit = 0;
    this.hit_goal = 1;

    this.increaseHit(client);
  }

  increaseHit(client) {
    this.hit += 1;
    this.checkHitGoal(client);
  }

  increaseHitGoal(client) {
    if (this.hit_goal === 1) {
      this.hit_goal = 3;
    }

    this.checkHitGoal(client);
  }

  private checkHitGoal(client) {
    if (this.hit >= this.hit_goal) {
      this.onHitGoalAchieved(client);
    }
  }

  onHitGoalAchieved(client) {
    log_new_active_user(client, this.member.id, this.last_message_sent);
  }

  allow_user() {
    this.member.roles.add(BASIC_ROLE).catch(console.error);
  }

  setLastMessageSent(content: string) {
    this.last_message_sent = content;
  }
}

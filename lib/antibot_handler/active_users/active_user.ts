import { GuildMember, Message } from "discord.js";
import { log_new_active_user } from "../logging";
import { DeferredSet } from "../../datatypes/deferred-set";

const { BASIC_ROLE } = require("../../constants");

type DebouncedAccumulatedData = Array<string>;
const debouncer = new DeferredSet<GuildMember["id"], DebouncedAccumulatedData>(30, 30);

/**
 * Represent a new but active user that may require some attention to get his
 * basic roles set up.
 */
export class NewActiveUser {
  public id: string;
  public creation_date: number;
  private member: GuildMember;
  private last_message_sent: string;
  private last_channel_id: string;

  private previous_log: Message;

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
    if (this.last_message_sent) {
      debouncer.set(
        this.member.id,
        (debounced_messages?: DebouncedAccumulatedData) => {
          this.sendLog(client, debounced_messages);

          return debounced_messages;
        },
        (acc?: DebouncedAccumulatedData) => [...(acc || []), this.last_message_sent]
      );
    }
  }

  allow_user() {
    this.member.roles.add(BASIC_ROLE).catch(console.error);
  }


  async sendLog(client, debounced_messages: DebouncedAccumulatedData) {
    if (this.previous_log && this.previous_log.deletable) {
      this.previous_log.delete().catch(console.error)
    }

    const message = await log_new_active_user(
      client,
      this.member.id,
      this.last_message_sent,
      this.last_channel_id,
      debounced_messages
    );

    if (message) {
      this.previous_log = message;
    }
  }

  setLastMessageSent(content: string, channel_id: string) {
    this.last_message_sent = content;
    this.last_channel_id = channel_id;
  }
}

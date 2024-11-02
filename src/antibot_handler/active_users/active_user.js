"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewActiveUser = void 0;
const logging_1 = require("../logging");
const deferred_set_1 = require("../../datatypes/deferred-set");
const { BASIC_ROLE } = require("../../constants");
const debouncer = new deferred_set_1.DeferredSet(120, 0);
/**
 * Represent a new but active user that may require some attention to get his
 * basic roles set up.
 */
class NewActiveUser {
    id;
    creation_date;
    member;
    last_message_sent;
    last_channel_id;
    /**
     * represents the amount of messages since the member has been created noticed
     */
    hit;
    hit_goal;
    constructor(member, client) {
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
    checkHitGoal(client) {
        if (this.hit >= this.hit_goal) {
            this.onHitGoalAchieved(client);
        }
    }
    onHitGoalAchieved(client) {
        if (this.last_message_sent) {
            debouncer.set(this.member.id, (debounced_messages) => (0, logging_1.log_new_active_user)(client, this.member.id, this.last_message_sent, this.last_channel_id, debounced_messages || []), (acc) => [...(acc || []), this.last_message_sent]);
        }
    }
    allow_user() {
        this.member.roles.add(BASIC_ROLE).catch(console.error);
    }
    setLastMessageSent(content, channel_id) {
        this.last_message_sent = content;
        this.last_channel_id = channel_id;
    }
}
exports.NewActiveUser = NewActiveUser;

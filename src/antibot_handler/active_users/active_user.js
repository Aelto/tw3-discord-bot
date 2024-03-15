"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewActiveUser = void 0;
const logging_1 = require("../logging");
const { BASIC_ROLE } = require("../../constants");
/**
 * Represent a new but active user that may require some attention to get his
 * basic roles set up.
 */
class NewActiveUser {
    id;
    creation_date;
    member;
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
        (0, logging_1.log_new_active_user)(client, this.member.id);
    }
    allow_user() {
        this.member.roles.add(BASIC_ROLE).catch(console.error);
    }
}
exports.NewActiveUser = NewActiveUser;

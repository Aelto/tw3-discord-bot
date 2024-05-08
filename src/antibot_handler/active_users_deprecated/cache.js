"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ActiveUserCache {
    members;
    constructor() {
        this.members = new Map();
    }
    getMember(id) {
        return this.members.get(id);
    }
    deleteMember(id) {
        this.members.delete(id);
    }
    addMember(user) {
        this.members.set(user.id, user);
        if (this.members.size >= 10) {
            this.removeOldestMember();
        }
    }
    removeOldestMember() {
        let oldest = null;
        for (const [id, member] of this.members) {
            if (oldest === null) {
                oldest = member;
                continue;
            }
            if (member.creation_date < oldest.creation_date) {
                oldest = member;
            }
        }
        if (oldest !== null) {
            this.deleteMember(oldest.id);
        }
    }
    increaseMemberHit(member, client) {
        const user = this.getMember(member.id);
        if (!user) {
            return false;
        }
        user.increaseHit(client);
        return true;
    }
}
const CACHE = new ActiveUserCache();
exports.default = CACHE;

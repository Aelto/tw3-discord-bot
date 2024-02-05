import { GuildMember } from "discord.js";
import { NewActiveUser } from "./active_user";

class ActiveUserCache {
  private members: Map<string, NewActiveUser>;
  
  constructor() {
    this.members = new Map();
  }

  getMember(id: string) {
    return this.members.get(id);
  }

  deleteMember(id: string) {
    this.members.delete(id);
  }

  addMember(user: NewActiveUser) {
    this.members.set(user.id, user);

    if (this.members.size >= 10) {
      this.removeOldestMember();
    }
  }

  private removeOldestMember() {
    let oldest: NewActiveUser = null;
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

  increaseMemberHit(member: GuildMember, client): boolean {
    const user = this.getMember(member.id);

    if (!user) {
      return false;
    }

    user.increaseHit(client);

    return true;
  }
}
const CACHE = new ActiveUserCache();
export default CACHE;
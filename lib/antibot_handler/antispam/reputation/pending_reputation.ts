export class MessagePendingReputation {
  private changes: ReputationRuleResult[] = [];
  private vars: Map<ReputationRuleResultKey, any> = new Map();

  private missing_vars: ReputationRuleResultKey[] = [];

  public append(reason: string, change: number) {
    this.changes.push({ reason, reputation_change: change });
  }

  public append_if(condition: boolean, reason: string, change: number) {
    if (condition) {
      this.append(reason, change);
    }
  }

  public setVar(key: ReputationRuleResultKey, value: any) {
    this.vars.set(key, value);
  }

  public getVar(key: ReputationRuleResultKey): any {
    const value = this.vars.get(key);

    // for logging mostly, to detect incorrect ordering of rules
    if (!value) {
      this.missing_vars.push(key);
    }

    return value;
  }

  public getVars(keys: ReputationRuleResultKey[]): any[] {
    return keys.map((key) => this.getVar(key));
  }

  public getTotalChange(): number {
    return this.changes.reduce((acc, n) => acc + n.reputation_change, 0);
  }

  public logMissingVars() {
    const vars = this.missing_vars.map((v) => v.toString()).join(", ");
    console.log("PendingReputation, missing vars: " + vars);
  }

  public toString(): string {
    return this.changes
      .map(
        (change) => `- **__${change.reputation_change}__**: ${change.reason}`
      )
      .join("\n");
  }
}

export type ReputationRuleResult = {
  reason: string;
  reputation_change: number;
};

export enum ReputationRuleResultKey {
  PreviousMessageDelta,
  PreviousMessageDeltaNormal,
  PreviousMessageSameContent,
  PreviousMessageSameChannel,
  AuthorHasRole,
  MentionsSomeone,
  HasLink,
  FirstMessage,
}

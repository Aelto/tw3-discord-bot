import { ListenerAnswers } from "./listener_answer";
import { Match } from "./listener_match";

export class Listener {
  matches: Match[];
  probability: number;
  only_direct_conversation: boolean;
  answers: ListenerAnswers;

  constructor({
    matches = [],
    probability = 1,
    answers,
    only_direct_conversation = false,
  }: {
    matches: Match[];
    probability: number;
    answers: ListenerAnswers;
    only_direct_conversation: boolean;
  }) {
    this.matches = matches;
    this.probability = probability;
    this.only_direct_conversation = only_direct_conversation;
    this.answers = answers;
  }

  public static fromJson(json: any) {
    return new Listener({
      ...json,
      matches: json.matches.map(Match.fromJson),
      answers: ListenerAnswers.fromJson(json.answers),
    });
  }

  toJSON() {
    return {
      matches: this.matches,
      probability: this.probability,
      only_direct_conversation: this.only_direct_conversation,
      answers: this.answers.toJSON(),
    };
  }

  /**
   * returns whether the given messages matches with this listener.
   * @param {String} message
   */
  doesMatch(formatted_message: string, message: string) {
    return this.matches.some((match) =>
      match.matches(formatted_message, message)
    );
  }
}

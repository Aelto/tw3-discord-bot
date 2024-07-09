"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listener = void 0;
const listener_answer_1 = require("./listener_answer");
const listener_match_1 = require("./listener_match");
class Listener {
    matches;
    probability;
    only_direct_conversation;
    answers;
    constructor({ matches = [], probability = 1, answers, only_direct_conversation = false, }) {
        this.matches = matches;
        this.probability = probability;
        this.only_direct_conversation = only_direct_conversation;
        this.answers = answers;
    }
    static fromJson(json) {
        return new Listener({
            ...json,
            matches: json.matches.map(listener_match_1.Match.fromJson),
            answers: listener_answer_1.ListenerAnswers.fromJson(json.answers),
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
    doesMatch(formatted_message, message) {
        return this.matches.some((match) => match.matches(formatted_message, message));
    }
}
exports.Listener = Listener;

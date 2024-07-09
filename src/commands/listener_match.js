"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Match = void 0;
class Match {
    match_string;
    cached_regex;
    cached_words;
    constructor(match_string) {
        this.match_string = match_string.toLowerCase();
        if (match_string.startsWith("/") && match_string.endsWith("/")) {
            this.cached_regex = new RegExp(match_string.slice(1, -1));
        }
        else {
            this.cached_words = this.match_string
                .split(" ")
                .map((word) => word.replace(/\$/g, " "));
        }
    }
    static fromJson(json) {
        return new Match(json);
    }
    matches(formatted_message, message) {
        if (this.cached_regex) {
            return this.cached_regex.test(message);
        }
        else {
            return this.cached_words.every((word) => formatted_message.includes(word));
        }
    }
    toJSON() {
        return this.match_string;
    }
}
exports.Match = Match;

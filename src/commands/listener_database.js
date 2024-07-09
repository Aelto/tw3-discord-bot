"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListenersDatabase = void 0;
const listener_1 = require("./listener");
class ListenersDatabase {
    listeners;
    constructor({ listeners = [] }) {
        this.listeners = listeners;
    }
    static fromJson(json) {
        return new ListenersDatabase({
            listeners: json.listeners.map(listener_1.Listener.fromJson),
        });
    }
    toJSON() {
        return { listeners: this.listeners };
    }
    push(listener) {
        this.listeners.push(listener);
    }
    remove(index) {
        this.listeners = this.listeners.filter((l, i) => i != index);
    }
    getListenersThatMatch(message) {
        let formatted_message = ` ${message.toLowerCase().trim()} `;
        return this.listeners.filter((listener) => listener.doesMatch(formatted_message, formatted_message.trim()));
    }
    getAnswersForMessage(message) {
        const listeners = this.getListenersThatMatch(message);
        return listeners.flatMap((listener) => listener.answers);
    }
}
exports.ListenersDatabase = ListenersDatabase;

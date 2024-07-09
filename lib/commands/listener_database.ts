import { Listener } from "./listener";

export class ListenersDatabase {
  listeners: Listener[];
  constructor({ listeners = [] }) {
    this.listeners = listeners;
  }

  public static fromJson(json: any) {
    return new ListenersDatabase({
      listeners: json.listeners.map(Listener.fromJson),
    });
  }

  toJSON() {
    return { listeners: this.listeners };
  }

  push(listener: Listener) {
    this.listeners.push(listener);
  }

  remove(index) {
    this.listeners = this.listeners.filter((l, i) => i != index);
  }

  getListenersThatMatch(message: string) {
    let formatted_message = ` ${message.toLowerCase().trim()} `;

    return this.listeners.filter((listener) =>
      listener.doesMatch(formatted_message, formatted_message.trim())
    );
  }

  getAnswersForMessage(message: string) {
    const listeners = this.getListenersThatMatch(message);

    return listeners.flatMap((listener) => listener.answers);
  }
}

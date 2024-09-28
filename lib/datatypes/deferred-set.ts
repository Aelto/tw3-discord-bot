export class DeferredSet<Key> {
  private debounce_buffer: Map<Key, NodeJS.Timeout> = new Map();
  private disable_buffer: Set<Key> = new Set();

  private debounce_seconds: number;
  private disable_seconds: number;

  constructor(debounce_seconds: number, disable_seconds: number) {
    this.debounce_seconds = debounce_seconds * 1000;
    this.disable_seconds = disable_seconds * 1000;
  }

  public set(id: Key, action: () => void) {
    if (this.disable_buffer.has(id)) {
      return;
    }

    const timeout_id = this.debounce_buffer.get(id);

    if (timeout_id) {
      clearTimeout(timeout_id);
    }

    this.debounce_buffer.set(
      id,
      setTimeout(() => {
        action();
        this.debounce_buffer.delete(id);

        // disable similar actions
        if (this.disable_seconds > 0) {
          this.disable_buffer.add(id);
          setTimeout(() => {
            this.disable_buffer.delete(id);
          }, this.disable_seconds);
        }
      }, this.debounce_seconds)
    );
  }
}

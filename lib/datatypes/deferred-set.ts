export class DeferredSet<Key, Accumulator> {
  private debounce_buffer: Map<Key, NodeJS.Timeout> = new Map();
  private disable_buffer: Set<Key> = new Set();

  // in case of a debounce it is possible to store additional data into an
  // "accumulator". This data is then passed to the final action after the
  // debounce is over
  private debounce_accumulators: Map<Key, Accumulator> = new Map();
  private debounce_actions: Map<Key, (acc?: Accumulator) => Accumulator> =
    new Map();

  private debounce_seconds: number;
  private disable_seconds: number;

  constructor(debounce_seconds: number, disable_seconds: number) {
    this.debounce_seconds = debounce_seconds * 1000;
    this.disable_seconds = disable_seconds * 1000;
  }

  public set(
    id: Key,
    action: (acc?: Accumulator) => void,
    // runs if this action get delayed by another call to `set` with the same id
    on_debounce?: (acc?: Accumulator) => Accumulator
  ) {
    if (this.disable_buffer.has(id)) {
      return;
    }

    const timeout_id = this.debounce_buffer.get(id);
    const accumulator = this.debounce_accumulators.get(id);

    if (timeout_id) {
      clearTimeout(timeout_id);

      const debounce_action = this.debounce_actions.get(id);
      if (debounce_action) {
        const new_accumulator = debounce_action(accumulator);

        this.debounce_accumulators.set(id, new_accumulator);
      }
    }

    if (on_debounce) {
      this.debounce_actions.set(id, on_debounce);
    }

    this.debounce_buffer.set(
      id,
      setTimeout(() => {
        action(accumulator);
        this.debounce_buffer.delete(id);
        this.debounce_actions.delete(id);

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

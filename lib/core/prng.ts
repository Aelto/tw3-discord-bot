class PRNG {
  storage: Map<number, number>;
  constructor() {
    this.storage = new Map();
  }

  nextProc(probability) {
    probability = Math.min(1, probability);
    probability = Math.max(0, probability);

    const roll = Math.random();

    // successfull roll right from the start:
    if (roll < probability) {
      this.storage.delete(probability);

      return true;
    }

    const current_counter_value = this.storage.get(probability) || 0;

    if (current_counter_value + probability >= 1) {
      this.storage.delete(probability);

      return true;
    }

    this.storage.set(probability, current_counter_value + probability);

    return false;
  }
}

export const prng = new PRNG();

export class FifoQueue<T> {
  private buffer: Array<T>;
  private index: number;

  constructor(size: number) {
    this.buffer = new Array(size);
    this.index = 0;
  }

  public insert(item: T) {
    this.buffer[this.index] = item;
    this.index = (this.index + 1) % this.buffer.length;
  }

  public remove(item: T) {
    const some_index = this.buffer.findIndex((i) => i === item);

    if (some_index >= 0) {
      this.buffer[some_index] = undefined;
    }
  }

  public all(): Array<T> {
    return this.buffer.filter((i) => i !== undefined);
  }
}

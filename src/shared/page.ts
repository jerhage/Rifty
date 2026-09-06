/** An immutable page of results with operations useful to paged data components. */
class Page<T> {
  readonly items: readonly T[];
  readonly hasMore: boolean;

  private constructor(items: readonly T[], hasMore: boolean) {
    this.items = Object.freeze([...items]);
    this.hasMore = hasMore;
  }

  static create<T>(items: readonly T[], hasMore: boolean): Page<T> {
    return new Page(items, hasMore);
  }

  static empty<T>(): Page<T> {
    return new Page([], false);
  }

  append(next: Page<T>): Page<T> {
    return new Page([...this.items, ...next.items], next.hasMore);
  }

  map<U>(transform: (item: T) => U): Page<U> {
    return new Page(this.items.map(transform), this.hasMore);
  }
}

export { Page };

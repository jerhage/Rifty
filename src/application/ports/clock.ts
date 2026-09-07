/**
 * Supplies the current instant, so application rules never call `Date.now()` and can be tested
 * against a fixed time. Timestamps are ISO-8601 strings, matching how the domain stores them.
 */
interface Clock {
  now(): string;
}

export type { Clock };

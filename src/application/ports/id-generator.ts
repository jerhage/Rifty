/** Supplies fresh identifiers, so application rules stay deterministic under test. */
interface IdGenerator {
  next(): string;
}

export type { IdGenerator };

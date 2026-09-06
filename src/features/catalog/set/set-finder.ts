import type { SetCode } from "../value-objects/set-code";
import type { CardSet } from "./card-set";

/** Finds one persisted card set by its catalog code. */
interface SetFinder {
  get(code: SetCode): Promise<CardSet | null>;
}

export type { SetFinder };

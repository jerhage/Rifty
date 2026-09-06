import type { SetCode } from "../value-objects/set-code";
import type { CardSet } from "./card-set";
import type { ReadOptions } from "@/shared/read-options";

/** Finds one persisted card set by its catalog code. */
interface SetFinder {
  get(code: SetCode, options?: ReadOptions): Promise<CardSet | null>;
}

export type { SetFinder };

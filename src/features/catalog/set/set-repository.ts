import type { SetFinder } from "./set-finder";
import type { SetLister } from "./set-lister";

/** Product-facing read capability for catalog sets. */
interface SetRepository extends SetFinder, SetLister {}

export type { SetRepository };

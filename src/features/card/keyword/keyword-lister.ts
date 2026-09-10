import type { ReadOptions } from "@/shared/read-options";

import type { Keyword } from "./keyword";

interface KeywordLister {
  getAll(options?: ReadOptions): Promise<readonly Keyword[]>;
}

export type { KeywordLister };

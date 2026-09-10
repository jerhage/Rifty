import type { ReadOptions } from "@/shared/read-options";
import type { Keyword } from "../keyword/keyword";
import type { KeywordLister } from "../keyword/keyword-lister";

type ListKeywordsResult =
  | { readonly type: "success"; readonly keywords: readonly Keyword[] }
  | { readonly type: "listFailed" };

interface ListKeywordsCapabilities {
  readonly keywordLister: KeywordLister;
}

async function listKeywords(
  { keywordLister }: ListKeywordsCapabilities,
  options?: ReadOptions,
): Promise<ListKeywordsResult> {
  try {
    return { type: "success", keywords: await keywordLister.getAll(options) };
  } catch {
    return { type: "listFailed" };
  }
}

export { listKeywords };
export type { ListKeywordsCapabilities, ListKeywordsResult };

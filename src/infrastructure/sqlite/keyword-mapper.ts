import { parseKeyword, type Keyword } from "@/features/card/keyword/keyword";
import { keywordSelectSchema } from "@/infrastructure/database/catalog-schema/keywords";

function toDomainKeyword(keyword: unknown): Keyword {
  const persistedKeyword = keywordSelectSchema.parse(keyword);

  return parseKeyword({
    id: persistedKeyword.id,
    name: persistedKeyword.name,
    reminderText: persistedKeyword.reminderText,
  });
}

export { toDomainKeyword };

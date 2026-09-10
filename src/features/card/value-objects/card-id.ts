import { z } from "zod/v4";

const cardIdSchema = z.string().trim().min(1).brand<"CardId">();

type CardId = z.output<typeof cardIdSchema>;

export { cardIdSchema };
export type { CardId };

import { z } from "zod/v4";

const cardTypeSchema = z.enum(["Battlefield", "Gear", "Legend", "Rune", "Spell", "Unit"]);

type CardType = z.output<typeof cardTypeSchema>;

export { cardTypeSchema };
export type { CardType };

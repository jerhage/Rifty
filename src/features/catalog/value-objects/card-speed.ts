import { z } from "zod/v4";

const cardSpeedSchema = z.enum(["normal", "action", "reaction"]);

type CardSpeed = z.output<typeof cardSpeedSchema>;

export { cardSpeedSchema };
export type { CardSpeed };

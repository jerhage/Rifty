import { match } from "ts-pattern";
import { z } from "zod/v4";

const cardSpeedSchema = z.enum(["normal", "action", "reaction"]);

type CardSpeed = z.output<typeof cardSpeedSchema>;

function cardSpeedName(speed: CardSpeed): string {
  return match(speed)
    .with("normal", () => "Normal")
    .with("action", () => "Action")
    .with("reaction", () => "Reaction")
    .exhaustive();
}

export { cardSpeedName, cardSpeedSchema };
export type { CardSpeed };

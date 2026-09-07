import { z } from "zod/v4";

const cardDomainSchema = z.enum(["Body", "Calm", "Chaos", "Colorless", "Fury", "Mind", "Order"]);

type CardDomain = z.output<typeof cardDomainSchema>;

export { cardDomainSchema };
export type { CardDomain };

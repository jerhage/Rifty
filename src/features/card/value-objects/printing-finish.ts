import { z } from "zod/v4";

const printingFinishSchema = z.enum([
  "standard",
  "alternateArt",
  "overnumbered",
  "signature",
  "metal",
  "metalDeluxe",
  "summonerCircle",
  "champion",
  "starter",
  "launchExclusive",
  "ultimate",
  "nx",
]);

type PrintingFinish = z.output<typeof printingFinishSchema>;

export { printingFinishSchema };
export type { PrintingFinish };

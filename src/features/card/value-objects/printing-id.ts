import { z } from "zod/v4";

const printingIdSchema = z.string().trim().min(1).brand<"PrintingId">();

type PrintingId = z.output<typeof printingIdSchema>;

export { printingIdSchema };
export type { PrintingId };

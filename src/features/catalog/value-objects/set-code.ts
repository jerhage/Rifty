import { z } from "zod/v4";

const setCodeSchema = z.string().trim().min(1);

type SetCode = z.output<typeof setCodeSchema>;

export { setCodeSchema };
export type { SetCode };

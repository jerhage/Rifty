import type { PrintingId } from "@/features/card/value-objects/printing-id";

type CardPaneContent =
  | { readonly type: "noCard" }
  | { readonly type: "card"; readonly printingId: PrintingId };

export type { CardPaneContent };

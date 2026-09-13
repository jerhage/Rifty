import { useCallback, useState } from "react";

import { useAnnouncement } from "@/hooks/use-announcement";
import { useLayoutSize } from "@/hooks/use-layout-size";

type DetailOpening<Subject, Id> =
  | {
      readonly type: "route";
      readonly open: (subject: Subject) => void;
    }
  | {
      readonly type: "pane";
      readonly close: () => void;
      readonly open: (subject: Subject) => void;
      readonly shownId: Id | null;
    };

interface DetailWords<Subject, Id> {
  readonly closedMessage: string;
  readonly idOf: (subject: Subject) => Id;
  readonly openedMessage: (subject: Subject) => string;
  readonly pushRoute: (id: Id) => void;
}

/**
 * How a picked thing gets shown: pushed as its own route where there is only room for one screen,
 * held in a pane beside what it was picked from where there is room for two.
 */
function useDetailOpening<Subject, Id>({
  closedMessage,
  idOf,
  openedMessage,
  pushRoute,
}: DetailWords<Subject, Id>): DetailOpening<Subject, Id> {
  const { layoutClass } = useLayoutSize();
  const announce = useAnnouncement();
  const [shownId, setShownId] = useState<Id | null>(null);

  const push = useCallback((subject: Subject) => pushRoute(idOf(subject)), [idOf, pushRoute]);

  const showInPane = useCallback(
    (subject: Subject) => {
      setShownId(idOf(subject));
      announce(openedMessage(subject), "interrupting");
    },
    [announce, idOf, openedMessage],
  );

  const closePane = useCallback(() => {
    setShownId(null);
    announce(closedMessage, "interrupting");
  }, [announce, closedMessage]);

  return layoutClass === "tablet"
    ? { close: closePane, open: showInPane, shownId, type: "pane" }
    : { open: push, type: "route" };
}

export { useDetailOpening };
export type { DetailOpening };

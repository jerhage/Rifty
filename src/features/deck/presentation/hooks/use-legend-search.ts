import { useCallback, useState } from "react";

import type { CardDomain } from "@/features/card/value-objects/card-domain";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { toggle } from "@/shared/toggle";

const SEARCH_DEBOUNCE_MS = 300;

function useLegendSearch() {
  const [query, setQuery] = useState("");
  const [domainIds, setDomainIds] = useState<readonly CardDomain[]>([]);

  /** The field updates on every keystroke; `searchQuery` waits for a pause in typing. */
  const searchQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  const toggleDomain = useCallback((domainId: CardDomain) => {
    setDomainIds((current) => toggle(current, domainId));
  }, []);

  return { domainIds, query, searchQuery, setQuery, toggleDomain };
}

export { useLegendSearch };

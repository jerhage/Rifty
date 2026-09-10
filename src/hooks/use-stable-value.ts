import { useState } from "react";

import { sameStructure } from "@/shared/same-structure";

function useStableValue<Value>(value: Value): Value {
  const [stable, setStable] = useState(value);

  if (sameStructure(stable, value)) return stable;

  setStable(value);

  return value;
}

export { useStableValue };

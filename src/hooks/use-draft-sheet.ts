import { useCallback, useState } from "react";

function useDraftSheet<Value>(createInitial: () => Value) {
  const [applied, setApplied] = useState<Value>(createInitial);
  const [draft, setDraft] = useState<Value>(createInitial);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setDraft(() => applied);
    setIsOpen(true);
  }, [applied]);

  const dismiss = useCallback(() => {
    setDraft(() => applied);
    setIsOpen(false);
  }, [applied]);

  const apply = useCallback(() => {
    setApplied(() => draft);
    setIsOpen(false);
  }, [draft]);

  const editDraft = useCallback((edit: (current: Value) => Value) => setDraft(edit), []);

  const settle = useCallback((value: Value) => {
    setApplied(() => value);
    setDraft(() => value);
  }, []);

  return { applied, apply, dismiss, draft, editDraft, isOpen, open, settle };
}

export { useDraftSheet };

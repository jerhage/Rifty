import { ErrorState } from "@/components/ui/atoms/error-state";

function MissingDeck() {
  return <ErrorState message="That deck no longer exists." />;
}

export { MissingDeck };

import type { Card } from "@/features/catalog/card/card";
import type { DomainColors } from "@/constants/theme";

type DomainPalette = (typeof DomainColors)[keyof typeof DomainColors];

/** A card can carry several domains; its first one colors the page. */
function domainAccent(card: Card, domainColors: DomainPalette): string {
  const [firstDomain] = card.domainIds;

  return firstDomain === undefined ? domainColors.Colorless : domainColors[firstDomain];
}

function formatDomains(card: Card): string {
  return card.domainIds.length === 0 ? "Colorless" : card.domainIds.join(" / ");
}

/** Taxonomy ids are stored kebab-cased; titles read better in the UI. */
function formatTaxonomyId(value: string): string {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export { domainAccent, formatDomains, formatTaxonomyId };
export type { DomainPalette };

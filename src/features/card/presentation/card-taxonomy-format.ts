import type { Card } from "@/features/card/card";
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

function formatCardTypeAndAttributes(card: Card): string {
  const energy = card.attributes.energy === null ? null : `${card.attributes.energy}E`;
  const might = card.attributes.might === null ? null : `${card.attributes.might}M`;

  return [card.classification.typeId, energy, might]
    .filter((part): part is string => part !== null)
    .join(" · ");
}

export { domainAccent, formatCardTypeAndAttributes, formatDomains, formatTaxonomyId };
export type { DomainPalette };

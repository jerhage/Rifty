import type { Card } from "@/features/card/card";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import type { DomainColors } from "@/constants/theme";

type DomainPalette = (typeof DomainColors)[keyof typeof DomainColors];

/** A card can carry several domains; its first one colors the page. */
function domainAccent(card: Card, domainColors: DomainPalette): string {
  const [firstDomain] = card.domainIds;

  return firstDomain === undefined ? domainColors.Colorless : domainColors[firstDomain];
}

/** The domains a card belongs to, one name per element, so a caller can choose its own separator. */
function cardDomainNames(domainIds: readonly CardDomain[]): readonly string[] {
  return domainIds.length === 0 ? ["Colorless"] : [...domainIds];
}

function formatDomains(card: Card): string {
  return cardDomainNames(card.domainIds).join(" / ");
}

/** Taxonomy ids are stored kebab-cased; titles read better in the UI. */
function formatTaxonomyId(value: string): string {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Each attribute the card carries, spelled out: "3 energy", "5 might", "2 power". */
function cardAttributeParts(card: Card): readonly string[] {
  return [
    card.attributes.energy === null ? null : `${card.attributes.energy} energy`,
    card.attributes.might === null ? null : `${card.attributes.might} might`,
    card.attributes.power === null ? null : `${card.attributes.power} power`,
  ].filter((part): part is string => part !== null);
}

function formatCardAttributes(card: Card): string {
  return cardAttributeParts(card).join(" · ");
}

function formatCardTypeAndAttributes(card: Card): string {
  const energy = card.attributes.energy === null ? null : `${card.attributes.energy}E`;
  const might = card.attributes.might === null ? null : `${card.attributes.might}M`;

  return [card.classification.typeId, energy, might]
    .filter((part): part is string => part !== null)
    .join(" · ");
}

/**
 * The spoken counterpart of `formatCardTypeAndAttributes`, whose "3E · 5M" a screen reader reads
 * as "three E dot five M".
 */
function spokenCardTypeAndAttributes(card: Card): string {
  return [card.classification.typeId, ...cardAttributeParts(card)].join(", ");
}

export {
  cardAttributeParts,
  cardDomainNames,
  domainAccent,
  formatCardAttributes,
  formatCardTypeAndAttributes,
  formatDomains,
  formatTaxonomyId,
  spokenCardTypeAndAttributes,
};
export type { DomainPalette };

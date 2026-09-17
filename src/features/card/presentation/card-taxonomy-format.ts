import type { Card, CardAttributes } from "@/features/card/card";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import type { CardType } from "@/features/card/value-objects/card-type";
import type { TaxonomyId } from "@/features/card/value-objects/taxonomy-id";
import type { DomainColors } from "@/constants/theme";

type DomainPalette = (typeof DomainColors)[keyof typeof DomainColors];

/** A card can carry several domains; its first one colors the page. */
function domainAccent(domainIds: readonly CardDomain[], domainColors: DomainPalette): string {
  const [firstDomain] = domainIds;

  return firstDomain === undefined ? domainColors.Colorless : domainColors[firstDomain];
}

/**
 * A one-letter stand-in for each domain, so a domain is readable where its hue is not. Calm, Chaos
 * and Colorless share an initial, so Chaos takes the X of its name and Colorless the N of neutral.
 */
const DOMAIN_CODES = {
  Body: "B",
  Calm: "C",
  Chaos: "X",
  Colorless: "N",
  Fury: "F",
  Mind: "M",
  Order: "O",
} as const satisfies Record<CardDomain, string>;

type DomainCode = (typeof DOMAIN_CODES)[CardDomain];

/** The letter that stands for a domain wherever its color cannot be relied on. */
function domainCode(domainId: CardDomain): DomainCode {
  return DOMAIN_CODES[domainId];
}

/** The domains a card belongs to, one name per element, so a caller can choose its own separator. */
function cardDomainNames(domainIds: readonly CardDomain[]): readonly CardDomain[] {
  return domainIds.length === 0 ? ["Colorless"] : [...domainIds];
}

function formatDomains(domainIds: readonly CardDomain[]): string {
  return cardDomainNames(domainIds).join(" / ");
}

/** Taxonomy ids are stored kebab-cased; titles read better in the UI. */
function formatTaxonomyId(value: CardType | TaxonomyId): string {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Each attribute the card carries, spelled out: "3 energy", "5 might", "2 power". */
function cardAttributeParts(attributes: CardAttributes): readonly string[] {
  return [
    attributes.energy === null ? null : `${attributes.energy} energy`,
    attributes.might === null ? null : `${attributes.might} might`,
    attributes.power === null ? null : `${attributes.power} power`,
  ].filter((part): part is string => part !== null);
}

function formatCardAttributes(attributes: CardAttributes): string {
  return cardAttributeParts(attributes).join(" · ");
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
  return [card.classification.typeId, ...cardAttributeParts(card.attributes)].join(", ");
}

export {
  cardAttributeParts,
  cardDomainNames,
  domainAccent,
  domainCode,
  formatCardAttributes,
  formatCardTypeAndAttributes,
  formatDomains,
  formatTaxonomyId,
  spokenCardTypeAndAttributes,
};
export type { DomainPalette };

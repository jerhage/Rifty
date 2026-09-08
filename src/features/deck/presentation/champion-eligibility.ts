import type { Card } from "@/features/catalog/card/card";

/**
 * A Chosen Champion has to match the character tag on the Legend and stay inside the Legend's
 * domain identity.
 *
 * I don't yet have the precise tags for cards that will let me determine if a given champion card
 * is for a given legend. I will later derive it and add to the db.
 * For now, the character tag is taken to be the one the Legend is named after — Riftbound names a Legend
 * for its character, as in "Ahri - Nine-Tailed Fox" carrying the Ahri tag.
 */
function characterTagOf(legend: Card): string | null {
  const name = legend.name.toLowerCase();

  return legend.tagIds.find((tag) => name.includes(tag.toLowerCase())) ?? null;
}

function isEligibleChampion(champion: Card, legend: Card): boolean {
  const characterTag = characterTagOf(legend);

  if (characterTag === null) return false;
  if (!champion.tagIds.includes(characterTag)) return false;

  return champion.domainIds.every((domain) => legend.domainIds.includes(domain));
}

function eligibleChampions(champions: readonly Card[], legend: Card | null): readonly Card[] {
  if (!legend) return champions;

  return champions.filter((champion) => isEligibleChampion(champion, legend));
}

export { characterTagOf, eligibleChampions, isEligibleChampion };

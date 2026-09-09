import { match } from "ts-pattern";
import { downloadTargetFor, imageFileNames } from "../../scripts/card-image-file";
import {
  cardSpeeds,
  championName,
  identityName,
  keywordOccurrences,
  keywordsWithMagnitude,
  leadingTokens,
  ownedKeywords,
  printingIdentity,
  withMagnitudeDefaults,
} from "../../scripts/card-derivation";
import type { KeywordOccurrence } from "../../scripts/card-derivation";

const standUnited =
  "[Hidden] (Hide now for :rb_rune_rainbow: to react with later for :rb_energy_0:.)[Action] (Play on your turn or in showdowns.)Buff a friendly unit.";
const block =
  "[Hidden] (Hide now for :rb_rune_rainbow: to react with later for :rb_energy_0:.)[Action] (Play on your turn or in showdowns.)Give a unit [Shield 3] and [Tank] this turn.";
const boneSkewer = "[Hidden] (Hide now.)Deal 3 damage to a unit and [Stun] it.";
const blastCone = "When you play this, [Stun] an enemy unit.";
const akaliRogueAssassin =
  "[Empower] [3]:rb_rune_rainbow: ([3]:rb_rune_rainbow: Empower this. Use only if not Empowered.)\n[Action][>] :rb_exhaust: If it's your turn, move a friendly unit in a showdown to base and if I'm [Empowered], ready it.";
const sunlitGuardian =
  "[Shield] (+1 :rb_might: while I'm a defender.)[Tank] (I must be assigned combat damage first.)";
const ambessa =
  "[Empower] [1]:rb_rune_order::rb_rune_order: ([1]:rb_rune_order::rb_rune_order: Empower me. Use only if not Empowered.)\n[Empowered][>] I have [Assault 2]. (+2 :rb_might: while I'm an attacker.)\n[Empowered][>] When I attack, kill an enemy unit here with less Might than me.";
const aurokGeneral =
  "[Empower] [3]:rb_rune_order: ([3]:rb_rune_order: Empower me. Use only if not Empowered.)\n[Empowered][>] Your units that are [Empowered] have +2 :rb_might: (including me).";

function scoped(text: string): readonly string[] {
  return keywordOccurrences(text).map(
    (keyword) =>
      `${label(keyword)}=${match(keyword.targeting)
        .with({ type: "targeted" }, (targeting) => targeting.scope)
        .with({ type: "unclassified" }, () => "unclassified")
        .exhaustive()}`,
  );
}

function label(keyword: KeywordOccurrence): string {
  return keyword.value === null ? keyword.id : `${keyword.id} ${keyword.value}`;
}

describe("card derivation", () => {
  it("reads only the bracket run that opens the text", () => {
    expect(leadingTokens(sunlitGuardian)).toEqual(["Shield", "Tank"]);
    expect(leadingTokens(blastCone)).toEqual([]);
  });

  it("keeps the keywords a card owns and drops the ones it merely grants", () => {
    expect(ownedKeywords(block).map((keyword) => keyword.name)).toEqual(["Hidden", "Action"]);
    expect(ownedKeywords(boneSkewer).map((keyword) => keyword.name)).toEqual(["Hidden"]);
    expect(ownedKeywords(blastCone)).toEqual([]);
    expect(ownedKeywords(akaliRogueAssassin).map((keyword) => keyword.name)).toEqual(["Empower"]);
  });

  it("captures every keyword the text prints, not only the run that opens it", () => {
    expect(scoped(ambessa)).toEqual(["empower=self", "empowered=self", "assault 2=self"]);
    expect(scoped(blastCone)).toEqual(["stun=other"]);
    expect(scoped("Other friendly units here have [Assault].")).toEqual(["assault=other"]);
  });

  it("scopes a keyword to the card that ends up with it", () => {
    expect(scoped(block)).toEqual(["hidden=self", "action=self", "shield 3=other", "tank=other"]);
    expect(scoped("While I'm [Mighty], I have [Deflect], [Ganking], and [Shield].")).toEqual([
      "mighty=self",
      "deflect=self",
      "ganking=self",
      "shield=self",
    ]);
    expect(scoped("Spells with [Flow] you play from your trash cost [2] less.")).toEqual([
      "flow=other",
    ]);
    expect(scoped(aurokGeneral)).toEqual(["empower=self", "empowered=self", "empowered=other"]);
  });

  it("reads a keyword a reminder defines as part of the definition, not as an occurrence", () => {
    expect(scoped("[Weaponmaster] (When you play me, you may [Equip] an Equipment.)")).toEqual([
      "weaponmaster=self",
    ]);
    expect(
      scoped('When I conquer, play a token. (It has "When I attack, give me [Assault 4]."))'),
    ).toEqual([]);
  });

  it("reads the target that follows the bracket when the lead-in names none", () => {
    expect(scoped("When I attack, [Stun] an enemy unit.")).toEqual(["stun=other"]);
    expect(scoped("You may exhaust this to [Stun] it.")).toEqual(["stun=other"]);
    expect(scoped("Spend 2 XP: [Buff] me.")).toEqual(["buff=self"]);
  });

  it("keeps a keyword that fills your own pool with you, unless the text names another actor", () => {
    expect(scoped("When I move, [Add] :rb_energy_1:.")).toEqual(["add=self"]);
    expect(scoped("While your score is behind, your Gold [Add] an extra :rb_energy_1:.")).toEqual([
      "add=self",
    ]);
    expect(scoped("If you do, [Predict], then reveal the top card.")).toEqual(["predict=self"]);
    expect(scoped("When you play me, [Burn 2].")).toEqual(["burn 2=self"]);
    expect(scoped("Choose a player. They [Burn 1].")).toEqual(["burn 1=other"]);
  });

  it("reports a lead-in and a trailing phrase it has none of rather than guessing a scope", () => {
    expect(keywordOccurrences("When you hold here, [Vision] twice.")).toEqual([
      {
        id: "vision",
        name: "Vision",
        value: null,
        cost: null,
        targeting: {
          type: "unclassified",
          leadIn: "When you hold here,",
          trailing: " twice.",
        },
      },
    ]);
  });

  it("splits a keyword's magnitude out of its name", () => {
    expect(ownedKeywords("[Shield 3] (+3 while defending.)")).toEqual([
      { id: "shield", name: "Shield", value: 3, cost: null },
    ]);
    expect(ownedKeywords("[Shield] (+1 while defending.)")).toEqual([
      { id: "shield", name: "Shield", value: null, cost: null },
    ]);
  });

  it("keeps the rune cost a keyword is paid with", () => {
    expect(ownedKeywords("[Equip] :rb_rune_calm: (Pay to equip.)")).toEqual([
      { id: "equip", name: "Equip", value: null, cost: ":rb_rune_calm:" },
    ]);
    expect(scoped("[Reaction] — [Add] :rb_rune_fury:.")).toEqual(["reaction=self", "add=self"]);
    expect(keywordOccurrences("[Reaction] — [Add] :rb_rune_fury:.")[1]?.cost).toBeNull();
    expect(ownedKeywords("[Equip :rb_rune_calm:] (Pay to equip.)")).toEqual([
      { id: "equip", name: "Equip", value: null, cost: ":rb_rune_calm:" },
    ]);
    expect(ownedKeywords("[Empower :rb_energy_3: :rb_rune_body:]")).toEqual([
      { id: "empower", name: "Empower", value: null, cost: ":rb_energy_3: :rb_rune_body:" },
    ]);
    expect(ownedKeywords("[Accelerate :rb_energy_1::rb_rune_calm:] (Enter ready.)")).toEqual([
      { id: "accelerate", name: "Accelerate", value: null, cost: ":rb_energy_1: :rb_rune_calm:" },
    ]);
  });

  it("treats a bare keyword as one where that keyword is ever numbered", () => {
    const magnitudeIds = keywordsWithMagnitude(["[Shield 3]", "[Hunt 2]", "[Tank]", "[Shield]"]);

    expect([...magnitudeIds].sort()).toEqual(["hunt", "shield"]);
    expect(
      withMagnitudeDefaults(ownedKeywords("[Shield] (+1 while defending.)"), magnitudeIds),
    ).toEqual([{ id: "shield", name: "Shield", value: 1, cost: null }]);
    expect(withMagnitudeDefaults(ownedKeywords("[Tank] (Damage first.)"), magnitudeIds)).toEqual([
      { id: "tank", name: "Tank", value: null, cost: null },
    ]);
    expect(withMagnitudeDefaults(ownedKeywords("[Hunt 3]"), magnitudeIds)).toEqual([
      { id: "hunt", name: "Hunt", value: 3, cost: null },
    ]);
  });

  it("folds casing drift onto one keyword", () => {
    expect(ownedKeywords("[ADD]")).toEqual(ownedKeywords("[Add]"));
    expect(ownedKeywords("[Quick-Draw]")[0]?.name).toBe("Quick-Draw");
  });

  it("ignores the tokens that are not keywords", () => {
    expect(ownedKeywords("[&gt;] [NO TEXT] [Level 6]")).toEqual([]);
    expect(keywordOccurrences("[&gt;] [NO TEXT] [Level 6] [2]")).toEqual([]);
  });

  it("gives a hidden card both the speed it is played at and the speed it returns at", () => {
    expect(cardSpeeds(standUnited)).toEqual(["action", "reaction"]);
    expect(cardSpeeds("[Hidden] (Hide now.)Draw 1.")).toEqual(["action", "reaction"]);
  });

  it("reads speed from the run that opens a line, not from a mention inside a sentence", () => {
    expect(cardSpeeds("[Reaction] (Play any time.)Counter a spell.")).toEqual(["reaction"]);
    expect(cardSpeeds("[Action] (Play on your turn.)Stun a unit.")).toEqual(["action"]);
    expect(cardSpeeds("Exhaust me: play a [Reaction] spell.")).toEqual(["normal"]);
    expect(cardSpeeds("You may play me as a [Reaction] to a battlefield.")).toEqual(["normal"]);
    expect(cardSpeeds(sunlitGuardian)).toEqual(["normal"]);
  });

  it("adds the speed an ability on a later line is activated at", () => {
    expect(cardSpeeds(akaliRogueAssassin)).toEqual(["normal", "action"]);
    expect(cardSpeeds("Draw 1.\n[Reaction][>] :rb_exhaust: Deal 1 to a unit.")).toEqual([
      "normal",
      "reaction",
    ]);
  });

  it("leaves a card that opens at its own speed off the normal speed", () => {
    expect(cardSpeeds("[Reaction] (Play any time.)Counter a spell.\n[Action][>] Draw 1.")).toEqual([
      "action",
      "reaction",
    ]);
  });

  it("prefers the champion the source names, and falls back to the name prefix", () => {
    const champion = { supertypeId: "Champion", typeId: "Unit" };
    const legend = { supertypeId: null, typeId: "Legend" };

    expect(championName({ name: "Ivern - Nurturer", champion: "Ivern", ...champion })).toBe(
      "Ivern",
    );
    expect(championName({ name: "Kai'Sa - Daughter of the Void", champion: null, ...legend })).toBe(
      "Kai'Sa",
    );
    expect(championName({ name: "Kennen, Heart of the Tempest", champion: null, ...legend })).toBe(
      "Kennen",
    );
    expect(championName({ name: "Mageseeker Warden", champion: null, ...champion })).toBeNull();
  });

  it("ignores the champion the source names on a card that is not one", () => {
    const plainUnit = { supertypeId: null, typeId: "Unit" };

    expect(championName({ name: "Pakaa Cub", champion: "Cat", ...plainUnit })).toBeNull();
    expect(
      championName({ name: "Stellacorn Herder", champion: "Mount Targon", ...plainUnit }),
    ).toBeNull();
    expect(
      championName({ name: "Daisy!", champion: "Ivern", supertypeId: "Signature", typeId: "Unit" }),
    ).toBe("Ivern");
  });

  it("names every local file webp and keeps two printings of one id apart", () => {
    const cards = [
      { id: "a", riftboundId: "opp-247-298", imageUrl: "https://x/a.png" },
      { id: "b", riftboundId: "opp-247-298", imageUrl: "https://x/b.webp" },
      { id: "c", riftboundId: "ogn-001-298", imageUrl: "https://x/c.webp" },
    ];

    expect([...imageFileNames(cards).values()]).toEqual([
      "opp-247-298.webp",
      "opp-247-298-2.webp",
      "ogn-001-298.webp",
    ]);
  });

  it("downloads under the source's own format, then converts to the webp it is named for", () => {
    expect(downloadTargetFor("opp-247-298.webp", "https://x/a.png")).toBe("opp-247-298.png");
    expect(downloadTargetFor("opp-247-298.webp", "https://x/a.webp")).toBe("opp-247-298.webp");
  });

  it("strips the printing qualifier from a card's identity", () => {
    expect(identityName("Yasuo (Alternate Art)")).toBe("Yasuo");
    expect(identityName("Jinx, Loose Cannon (Signature)")).toBe("Jinx - Loose Cannon");
    expect(identityName("Sett (Overnumbered)")).toBe("Sett");
  });

  it("canonicalizes the separator so one card keeps one identity", () => {
    expect(identityName("Sett - Brawler")).toBe("Sett - Brawler");
    expect(identityName("Sett, Brawler")).toBe("Sett - Brawler");
    expect(identityName("Mel - Newly Awakened (Alternate Art)")).toBe("Mel - Newly Awakened");
    expect(identityName("Riven - Shattered")).toBe(identityName("Riven, Shattered"));
  });

  it("leaves a name with no separator and no qualifier alone", () => {
    expect(identityName("Blazing Scorcher")).toBe("Blazing Scorcher");
    expect(identityName("Anti-Mage")).toBe("Anti-Mage");
    expect(identityName("Yordle Sniper")).toBe("Yordle Sniper");
  });

  it("reads the pool, the collector number, and both printing marks from the id", () => {
    expect(printingIdentity("ogn-042-298")).toEqual({
      poolCode: "298",
      collectorNumber: 42,
      isOvernumbered: false,
      isSignature: false,
    });
    expect(printingIdentity("unl-233*-219")).toEqual({
      poolCode: "219",
      collectorNumber: 233,
      isOvernumbered: true,
      isSignature: true,
    });
    expect(printingIdentity("unl-051a-219")).toEqual({
      poolCode: "219",
      collectorNumber: 51,
      isOvernumbered: false,
      isSignature: false,
    });
  });

  it("leaves the newer id format without a pool rather than guessing one", () => {
    expect(printingIdentity("VEN-001")).toEqual({
      poolCode: null,
      collectorNumber: 1,
      isOvernumbered: false,
      isSignature: false,
    });
  });
});

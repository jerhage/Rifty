import { match } from "ts-pattern";
import { downloadTargetFor, imageFileNames } from "../../scripts/card-image-file";
import {
  cardSpeeds,
  championName,
  cleanName,
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

function targeted(text: string): readonly string[] {
  return keywordOccurrences(text).map(
    (keyword) =>
      `${label(keyword)}=${match(keyword.targeting)
        .with({ type: "targeted" }, ({ targets }) =>
          targets
            .map((target) => `${target.kind}${target.isToken ? " token" : ""}:${target.allegiance}`)
            .join("+"),
        )
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
    expect(targeted(ambessa)).toEqual([
      "empower=self:own",
      "empowered=self:own",
      "assault 2=self:own",
    ]);
    expect(targeted(blastCone)).toEqual(["stun=unit:enemy"]);
    expect(targeted("Other friendly units here have [Assault].")).toEqual([
      "assault=unit:friendly",
    ]);
  });

  it("names what a keyword lands on, not only whether it is the card itself", () => {
    expect(targeted(block)).toEqual([
      "hidden=self:own",
      "action=self:own",
      "shield 3=unit:unspecified",
      "tank=unit:unspecified",
    ]);
    expect(targeted("While I'm [Mighty], I have [Deflect], [Ganking], and [Shield].")).toEqual([
      "mighty=self:own",
      "deflect=self:own",
      "ganking=self:own",
      "shield=self:own",
    ]);
    expect(targeted("Spells with [Flow] you play from your trash cost [2] less.")).toEqual([
      "flow=spell:unspecified",
    ]);
    expect(targeted(aurokGeneral)).toEqual([
      "empower=self:own",
      "empowered=self:own",
      "empowered=unit:friendly",
    ]);
  });

  it("keeps a gear's own condition apart from a condition on a thing it chose", () => {
    expect(
      targeted("Opponents' spells cost [1] more. If this is [Empowered], they cost [2] more."),
    ).toEqual(["empowered=self:own"]);
    expect(targeted("Give a unit +2 :rb_might:. If it's [Empowered], give it +4 instead.")).toEqual(
      ["empowered=unit:unspecified"],
    );
  });

  it("gives a quoted granted ability to the token that carries it, not to the printing", () => {
    expect(
      targeted(
        'Play a 0 :rb_might: Shadow Clone unit token. (It has "When I attack, give me [Assault 4] this turn.")',
      ),
    ).toEqual(["assault 4=unit token:friendly"]);
    expect(
      targeted(
        "Play a Gold gear token exhausted. (It has &quot;[Reaction][&gt;] Kill this, :rb_exhaust:: [Add] :rb_rune_rainbow:.&quot;)",
      ),
    ).toEqual(["reaction=gear token:friendly", "add=gear token:friendly"]);
  });

  it("records both players when the text says each of them does it", () => {
    expect(targeted("When combat starts here, the attacker and defender each [Add] [1].")).toEqual([
      "add=player:own+player:enemy",
    ]);
  });

  it("reads a keyword named as a rule, an effect, or a cost rather than as a bearer", () => {
    expect(targeted("You ignore [Tank] while assigning combat damage here.")).toEqual([
      "tank=rule:unspecified",
    ]);
    expect(targeted("Your [Deathknell] effects trigger an additional time.")).toEqual([
      "deathknell=effect:friendly",
    ]);
    expect(
      targeted("While you control this battlefield, friendly [Repeat] costs cost [1] less."),
    ).toEqual(["repeat=cost:friendly"]);
  });

  it("reads a keyword a reminder defines as part of the definition, not as an occurrence", () => {
    expect(targeted("[Weaponmaster] (When you play me, you may [Equip] an Equipment.)")).toEqual([
      "weaponmaster=self:own",
    ]);
    expect(targeted("[Shield] (+1 :rb_might: while I'm a defender.)")).toEqual(["shield=self:own"]);
  });

  it("reads the target that follows the bracket when the lead-in names none", () => {
    expect(targeted("When I attack, [Stun] an enemy unit.")).toEqual(["stun=unit:enemy"]);
    expect(targeted("You may exhaust this to [Stun] it.")).toEqual(["stun=unit:unspecified"]);
    expect(targeted("Spend 2 XP: [Buff] me.")).toEqual(["buff=self:own"]);
  });

  it("keeps a keyword that fills your own pool with you, unless the text names another actor", () => {
    expect(targeted("When I move, [Add] :rb_energy_1:.")).toEqual(["add=player:own"]);
    expect(targeted("While your score is behind, your Gold [Add] an extra :rb_energy_1:.")).toEqual(
      ["add=player:own"],
    );
    expect(targeted("If you do, [Predict], then reveal the top card.")).toEqual([
      "predict=player:own",
    ]);
    expect(targeted("When you play me, [Burn 2].")).toEqual(["burn 2=player:own"]);
    expect(targeted("Choose a player. They [Burn 1].")).toEqual(["burn 1=player:any_player"]);
  });

  it("reports a lead-in and a trailing phrase it has none of rather than guessing a target", () => {
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

  it("keeps the rune cost inside a keyword's bracket, and not a rune that merely follows it", () => {
    expect(ownedKeywords("[Equip] :rb_rune_calm: (Pay to equip.)")).toEqual([
      { id: "equip", name: "Equip", value: null, cost: ":rb_rune_calm:" },
    ]);
    expect(targeted("[Reaction] — [Add] :rb_rune_fury:.")).toEqual([
      "reaction=self:own",
      "add=player:own",
    ]);
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

  it("folds the champion's name to one spelling as well", () => {
    const legend = { supertypeId: null, typeId: "Legend" };

    expect(
      championName({ name: "Daughter of the Void (Metal)", champion: "Kai\u2019Sa", ...legend }),
    ).toBe("Kai'Sa");
    expect(
      championName({ name: "K\u2019Sante \u2013 Courageous", champion: null, ...legend }),
    ).toBe("K'Sante");
  });

  it("ignores the champion the source names on a plain unit but keeps it on a signature", () => {
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
    expect(identityName("Jinx, Loose Cannon (Signature)")).toBe("Jinx, Loose Cannon");
    expect(identityName("Sett (Overnumbered)")).toBe("Sett");
  });

  it("canonicalizes the separator so one card keeps one identity", () => {
    expect(identityName("Sett - Brawler")).toBe("Sett, Brawler");
    expect(identityName("Sett, Brawler")).toBe("Sett, Brawler");
    expect(identityName("Mel - Newly Awakened (Alternate Art)")).toBe("Mel, Newly Awakened");
    expect(identityName("Riven - Shattered")).toBe(identityName("Riven, Shattered"));
  });

  it("folds every apostrophe and dash variant so one card keeps one identity", () => {
    expect(identityName("Doran\u2019s Shield")).toBe("Doran's Shield");
    expect(identityName("Aspirant\u2019s Climb")).toBe(identityName("Aspirant's Climb"));
    expect(identityName("K\u2019Sante \u2013 Courageous")).toBe("K'Sante, Courageous");
    expect(identityName("Kai\u2019Sa,  Survivor  ")).toBe(identityName("Kai'Sa - Survivor"));
  });

  it("leaves a name with no separator and no qualifier alone", () => {
    expect(identityName("Blazing Scorcher")).toBe("Blazing Scorcher");
    expect(identityName("Anti-Mage")).toBe("Anti-Mage");
    expect(identityName("Yordle Sniper")).toBe("Yordle Sniper");
  });

  it("elides punctuation inside a word but collapses a separator to one space", () => {
    expect(cleanName("Doran's Shield")).toBe("Dorans Shield");
    expect(cleanName("Kai'Sa - Survivor")).toBe("KaiSa Survivor");
    expect(cleanName("Sett - Brawler")).toBe("Sett Brawler");
    expect(cleanName("Mel, Soul's Reflection")).toBe("Mel Souls Reflection");
  });

  it("keeps a hyphen that joins a word and drops one that introduces a subtitle", () => {
    expect(cleanName("Mega-Mech")).toBe("Mega-Mech");
    expect(cleanName("Ahri - Nine-Tailed Fox")).toBe("Ahri Nine-Tailed Fox");
    expect(cleanName("Renata Glasc - Chem-Baroness")).toBe("Renata Glasc Chem-Baroness");
    expect(cleanName("B.F. Sword")).toBe("B.F Sword");
  });

  it("folds every apostrophe and dash variant so one card keeps one search key", () => {
    expect(cleanName("Doran\u2019s Shield")).toBe(cleanName("Doran's Shield"));
    expect(cleanName("Aspirant\u2019s Climb")).toBe("Aspirants Climb");
    expect(cleanName("Kai\u2019Sa \u2013 Survivor")).toBe(cleanName("Kai'Sa - Survivor"));
  });

  it("leaves no empty, doubled or edge space in the search key", () => {
    expect(cleanName("Yasuo - Remorseful (Alternate Art)")).toBe("Yasuo Remorseful Alternate Art");
    expect(cleanName("Recruit (271) // Buff")).toBe("Recruit 271 Buff");
    expect(cleanName("Get Excited!")).toBe("Get Excited");
    expect(cleanName("Ol' Poro")).toBe("Ol Poro");
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

import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const projectRoot = process.cwd();
const generator = join(projectRoot, "scripts/generate-catalog-seed.ts");

function runGenerator(environment: Partial<NodeJS.ProcessEnv> = {}): string {
  const result = spawnSync(
    "deno",
    ["run", "--sloppy-imports", "--allow-read", "--allow-write", "--allow-env", generator],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: { ...process.env, ...environment },
    },
  );

  if (result.error) throw result.error;
  // Capture expected generator failures so their stderr does not pollute Jest output.
  if (result.status !== 0) throw new Error(result.stderr.toString());

  return `${result.stdout.toString()}${result.stderr.toString()}`;
}

async function generatedSeed(): Promise<string> {
  return readFile(
    join(projectRoot, "src/infrastructure/database/generated/catalog-seed.ts"),
    "utf8",
  );
}

describe("catalog seed generator", () => {
  it("keeps every printing and names one of them for each Riftbound ID", async () => {
    expect(runGenerator()).toMatch(/Generated .* with \d+ cards/);

    const seed = await generatedSeed();
    const cards = [
      ...seed.matchAll(/"riftboundId": "([^"]+)"[\s\S]*?"isCanonical": (true|false)/g),
    ];
    const riftboundIds = cards.map((match) => match[1]!);
    const canonicalIds = cards.filter((match) => match[2] === "true").map((match) => match[1]!);

    expect(riftboundIds.length).toBeGreaterThan(new Set(riftboundIds).size);
    expect(new Set(canonicalIds).size).toBe(canonicalIds.length);
    expect(new Set(canonicalIds)).toEqual(new Set(riftboundIds));
  });

  it("gives every card a media row so none drops out of the catalog", async () => {
    const seed = await generatedSeed();
    const cardIds = [...seed.matchAll(/"riftboundId": "[^"]+"/g)].length;
    const mediaRows = [...seed.matchAll(/"imageFile": "[^"]+"/g)].length;

    expect(mediaRows).toBe(cardIds);
  });

  it("skips a card whose set is absent rather than dropping it silently", async () => {
    const directory = await mkdtemp(join(tmpdir(), "riftcards-seed-"));
    const dataDirectory = join(directory, "data");
    const outputPath = join(directory, "catalog-seed.ts");
    await cp(join(projectRoot, "data"), dataDirectory, { recursive: true });

    const cardFilePath = join(dataDirectory, "api", "cards-JDG.json");
    const file = JSON.parse(await readFile(cardFilePath, "utf8")) as {
      cards: Array<{ setCode: string; raw?: { set?: { set_id?: string } } }>;
    };
    const [first] = file.cards;
    first!.setCode = "MISSING";
    if (first?.raw?.set) first.raw.set.set_id = "MISSING";
    await writeFile(cardFilePath, JSON.stringify(file));

    const output = runGenerator({
      CATALOG_DATA_DIRECTORY: dataDirectory,
      CATALOG_SEED_OUTPUT_PATH: outputPath,
    });

    expect(output).toMatch(/Skipped \d+ cards? belonging to sets missing/);
    await rm(directory, { force: true, recursive: true });
  });
});

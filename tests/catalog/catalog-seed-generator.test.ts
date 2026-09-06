import { execFileSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const projectRoot = process.cwd();
const generator = join(projectRoot, "scripts/generate-catalog-seed.ts");

function runGenerator(environment: Partial<NodeJS.ProcessEnv> = {}): string {
  return execFileSync("deno", ["run", "--sloppy-imports", "--allow-read", "--allow-write", "--allow-env", generator], {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, ...environment },
  });
}

describe("catalog seed generator", () => {
  it("generates the checked-in catalog data", () => {
    expect(runGenerator()).toMatch(/Generated .* with 1451 cards/);
  });

  it("rejects a card whose set is absent from the supplied set pages", async () => {
    const directory = await mkdtemp(join(tmpdir(), "riftcards-seed-"));
    const dataDirectory = join(directory, "data");
    const outputPath = join(directory, "catalog-seed.ts");
    await cp(join(projectRoot, "data"), dataDirectory, { recursive: true });
    const cardPagePath = join(dataDirectory, "cards-page-1.json");
    const page = JSON.parse(await readFile(cardPagePath, "utf8")) as { items: Array<{ set: { set_id: string } }> };
    page.items[0]!.set.set_id = "MISSING";
    await writeFile(cardPagePath, JSON.stringify(page));

    expect(() => runGenerator({ CATALOG_DATA_DIRECTORY: dataDirectory, CATALOG_SEED_OUTPUT_PATH: outputPath })).toThrow(
      /refers to missing set MISSING/,
    );
    await rm(directory, { force: true, recursive: true });
  });
});

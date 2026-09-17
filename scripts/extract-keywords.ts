import { readFileSync, writeFileSync } from "node:fs";

type StartEndTuple = [string, string];

const KEYWORD_MARKERS: StartEndTuple = ["[", "]"] as const;
const SPECIAL_COST_MARKERS: StartEndTuple = [":", ":"] as const;

// "Alpha" boundary here means "not whitespace" — keywords like rb_energy_2
// contain digits and underscores, so we only need to guard against spaces.
const isAlpha = (char: string | undefined): boolean => char !== undefined && /\S/.test(char);

const createScanner = () => {
  const words = new Set<string>();
  const specialCosts = new Set<string>();

  const targets = [
    { markers: KEYWORD_MARKERS, set: words, requireAlphaBoundary: false },
    { markers: SPECIAL_COST_MARKERS, set: specialCosts, requireAlphaBoundary: true },
  ];

  const scan = (text: string) => {
    let active: {
      end: string;
      set: Set<string>;
      buffer: string;
      requireAlphaBoundary: boolean;
    } | null = null;

    for (let i = 0; i < text.length; i++) {
      const char = text.at(i);

      if (active) {
        if (char === active.end) {
          const boundaryOk = !active.requireAlphaBoundary || isAlpha(active.buffer.at(-1));

          if (boundaryOk) {
            active.set.add(active.buffer);
            active = null;
            continue;
          }
          // Not a valid close (e.g. preceded by a space) — treat ':' as literal text.
          active.buffer += char;
          continue;
        }
        active.buffer += char;
        continue;
      }

      const target = targets.find((t) => t.markers[0] === char);
      if (target) {
        if (target.requireAlphaBoundary && !isAlpha(text.at(i + 1))) {
          // Not a valid open (e.g. followed by a space, digit, or end of string) — skip it.
          continue;
        }
        active = {
          end: target.markers[1],
          set: target.set,
          buffer: "",
          requireAlphaBoundary: target.requireAlphaBoundary,
        };
      }
    }
  };

  return { words, symbols: specialCosts, scan };
};

const loadTexts = (filePath: string): string[] => {
  const raw = readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected a JSON array in ${filePath}, got ${typeof parsed}`);
  }

  return parsed;
};

const main = () => {
  const filePath = process.argv.at(2);
  const outputPath = process.argv.at(3) ?? "scan-results.json";

  if (!filePath) {
    console.error("Usage: tsx scanner.ts <path-to-texts.json> [output-path.json]");
    process.exit(1);
  }

  const texts = loadTexts(filePath);
  const { words, symbols, scan } = createScanner();

  for (const text of texts) {
    scan(text);
  }

  const result = { words: [...words], symbols: [...symbols] };

  writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");

  console.log(`Scanned ${texts.length} texts.`);
  console.log(
    `Found ${result.words.length} unique words, ${result.symbols.length} unique symbols.`,
  );
  console.log(`Results written to ${outputPath}`);
};

main();

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

const sourceRoot = resolve("src");
const featureImportAllowances: Record<string, readonly string[]> = {
  set: ["set"],
  card: ["card", "set"],
  analysis: ["analysis", "card"],
  catalog: ["catalog", "card", "set"],
  deck: ["deck", "card", "analysis"],
};
const zonesForbiddenFromFeatures = ["components", "hooks", "constants", "shared", "application"];
const zonesForbiddenFromPersistenceFreeFeatures = ["infrastructure", "composition"];
const persistenceFreeFeatures = ["catalog", "analysis"];
const resolvableExtensions = [".ts", ".tsx", ".d.ts", ".js", ".jsx", ".css", ".sql"];

type SourceFile = {
  readonly path: string;
  readonly zone: string;
  readonly isFeature: boolean;
};
type Edge = {
  readonly from: string;
  readonly to: string;
  readonly specifier: string;
};
type Violation = {
  readonly rule: string;
  readonly from: string;
  readonly to: string;
  readonly specifier: string;
};

const collectFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const found: string[] = [];
  for (const entry of entries) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await collectFiles(full)));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) found.push(full);
  }
  return found.sort();
};

const stripCommentsKeepingStrings = (source: string): string => {
  let out = "";
  let index = 0;
  while (index < source.length) {
    const character = source[index];
    const next = source[index + 1];
    if (character === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        if (source[index] === "\n") out += "\n";
        index += 1;
      }
      index += 2;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      const quote = character;
      out += character;
      index += 1;
      while (index < source.length) {
        const inner = source[index];
        if (inner === "\\") {
          out += source.slice(index, index + 2);
          index += 2;
          continue;
        }
        out += inner;
        index += 1;
        if (inner === quote) break;
      }
      continue;
    }
    out += character;
    index += 1;
  }
  return out;
};

const specifiersIn = (source: string): string[] => {
  const code = stripCommentsKeepingStrings(source);
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']/g,
    /\bimport\s+["']([^"']+)["']/g,
    /\brequire\s*\(\s*["']([^"']+)["']/g,
  ];
  const found: string[] = [];
  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier !== undefined) found.push(specifier);
    }
  }
  return found;
};

const fileExists = async (candidate: string): Promise<boolean> => {
  try {
    const info = await stat(candidate);
    return info.isFile();
  } catch {
    return false;
  }
};

const resolveToFile = async (base: string): Promise<string | undefined> => {
  const candidates = [
    base,
    ...resolvableExtensions.map((extension) => `${base}${extension}`),
    ...resolvableExtensions.map((extension) => join(base, `index${extension}`)),
  ];
  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }
  return undefined;
};

const resolveSpecifier = async (
  fromFile: string,
  specifier: string,
): Promise<string | undefined> => {
  if (specifier.startsWith("@/assets/")) return undefined;
  const base = specifier.startsWith("@/")
    ? join(sourceRoot, specifier.slice(2))
    : specifier.startsWith(".")
      ? resolve(dirname(fromFile), specifier)
      : undefined;
  if (base === undefined) return undefined;
  return await resolveToFile(base);
};

const zoneOf = (path: string): SourceFile => {
  const relativePath = relative(sourceRoot, path);
  const segments = relativePath.split(sep);
  const head = segments[0] ?? "root";
  if (head === "features") return { path, zone: segments[1] ?? "features", isFeature: true };
  if (segments.length === 1) return { path, zone: "root", isFeature: false };
  return { path, zone: head, isFeature: false };
};

const tarjanCycles = (nodes: readonly string[], edges: ReadonlyMap<string, Set<string>>) => {
  const index = new Map<string, number>();
  const lowLink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const components: string[][] = [];
  let counter = 0;

  const strongConnect = (node: string) => {
    index.set(node, counter);
    lowLink.set(node, counter);
    counter += 1;
    stack.push(node);
    onStack.add(node);
    for (const next of edges.get(node) ?? []) {
      if (!index.has(next)) {
        strongConnect(next);
        lowLink.set(node, Math.min(lowLink.get(node) ?? 0, lowLink.get(next) ?? 0));
      } else if (onStack.has(next)) {
        lowLink.set(node, Math.min(lowLink.get(node) ?? 0, index.get(next) ?? 0));
      }
    }
    if (lowLink.get(node) === index.get(node)) {
      const component: string[] = [];
      for (;;) {
        const popped = stack.pop();
        if (popped === undefined) break;
        onStack.delete(popped);
        component.push(popped);
        if (popped === node) break;
      }
      components.push(component);
    }
  };

  for (const node of nodes) if (!index.has(node)) strongConnect(node);

  const cycles: { path: string[]; group: string[] }[] = [];
  for (const component of components) {
    const members = new Set(component);
    const head = component[0] ?? "";
    const selfLooping = component.length === 1 && (edges.get(head)?.has(head) ?? false);
    if (component.length < 2 && !selfLooping) continue;
    const start = component[component.length - 1];
    if (start === undefined) continue;
    const path: string[] = [];
    const seen = new Set<string>();
    const walk = (node: string): boolean => {
      path.push(node);
      seen.add(node);
      for (const next of edges.get(node) ?? []) {
        if (!members.has(next)) continue;
        if (next === start) {
          path.push(start);
          return true;
        }
        if (!seen.has(next) && walk(next)) return true;
      }
      path.pop();
      seen.delete(node);
      return false;
    };
    const group = [...component].sort();
    if (walk(start)) cycles.push({ path, group });
    else cycles.push({ path: [...component, start], group });
  }
  return cycles;
};

const shortPath = (path: string) => relative(resolve("."), path);

const files = await collectFiles(sourceRoot);
const zones = new Map<string, SourceFile>();
for (const file of files) zones.set(file, zoneOf(file));

const edges: Edge[] = [];
const unresolved: { readonly from: string; readonly specifier: string }[] = [];
for (const file of files) {
  const source = await readFile(file, "utf8");
  for (const specifier of specifiersIn(source)) {
    if (!specifier.startsWith("@/") && !specifier.startsWith(".")) continue;
    if (specifier.startsWith("@/assets/")) continue;
    const target = await resolveSpecifier(file, specifier);
    if (target === undefined) {
      unresolved.push({ from: file, specifier });
      continue;
    }
    if (!target.startsWith(sourceRoot + sep)) continue;
    if (target === file) continue;
    edges.push({ from: file, to: target, specifier });
  }
}

const fileEdges = new Map<string, Set<string>>();
for (const edge of edges) {
  const existing = fileEdges.get(edge.from) ?? new Set<string>();
  existing.add(edge.to);
  fileEdges.set(edge.from, existing);
}

const zoneEdgeFiles = new Map<string, Set<string>>();
const zoneEdges = new Map<string, Set<string>>();
const zoneFileCounts = new Map<string, number>();
const featureZoneNames = new Set<string>();
for (const file of files) {
  const zone = zones.get(file);
  if (zone === undefined) continue;
  zoneFileCounts.set(zone.zone, (zoneFileCounts.get(zone.zone) ?? 0) + 1);
  if (zone.isFeature) featureZoneNames.add(zone.zone);
}
for (const edge of edges) {
  const from = zones.get(edge.from)?.zone;
  const to = zones.get(edge.to)?.zone;
  if (from === undefined || to === undefined || from === to) continue;
  const key = `${from} ${to}`;
  const pairs = zoneEdgeFiles.get(key) ?? new Set<string>();
  pairs.add(`${edge.from} ${edge.to}`);
  zoneEdgeFiles.set(key, pairs);
  const targets = zoneEdges.get(from) ?? new Set<string>();
  targets.add(to);
  zoneEdges.set(from, targets);
}

const violations: Violation[] = [];
for (const edge of edges) {
  const from = zones.get(edge.from);
  const to = zones.get(edge.to);
  if (from === undefined || to === undefined || from.zone === to.zone) continue;
  const record = (rule: string) =>
    violations.push({ rule, from: edge.from, to: edge.to, specifier: edge.specifier });

  if (from.isFeature && to.isFeature) {
    const allowed = featureImportAllowances[from.zone];
    if (allowed !== undefined && !allowed.includes(to.zone)) {
      record(`feature ${from.zone} may import only ${allowed.join(", ")}`);
    }
  }
  if (from.isFeature && to.zone === "infrastructure") record("no feature imports infrastructure");
  if (from.zone === "infrastructure" && to.zone === "composition") {
    record("infrastructure does not import composition");
  }
  if (zonesForbiddenFromFeatures.includes(from.zone) && to.isFeature) {
    record(`${zonesForbiddenFromFeatures.join(", ")} import no feature`);
  }
  if (
    zonesForbiddenFromPersistenceFreeFeatures.includes(from.zone) &&
    persistenceFreeFeatures.includes(to.zone)
  ) {
    record(
      `infrastructure and composition import neither ${persistenceFreeFeatures.join(" nor ")}`,
    );
  }
}

const fileCycles = tarjanCycles(files, fileEdges);
const zoneCycles = tarjanCycles([...zoneFileCounts.keys()], zoneEdges);

const sortedZones = [...zoneFileCounts.keys()].sort();
const featureZones = sortedZones.filter((zone) => featureZoneNames.has(zone));
const otherZones = sortedZones.filter((zone) => !featureZoneNames.has(zone));

const edgeCount = (from: string, to: string) => zoneEdgeFiles.get(`${from} ${to}`)?.size ?? 0;
const targetsOf = (zone: string) =>
  [...(zoneEdges.get(zone) ?? [])].sort(
    (a, b) => edgeCount(zone, b) - edgeCount(zone, a) || a.localeCompare(b),
  );
const importersOf = (zone: string) =>
  sortedZones.filter((other) => other !== zone && (zoneEdges.get(other)?.has(zone) ?? false));

const pad = (value: string, width: number) => value.padEnd(width);
const nameWidth = Math.max(...sortedZones.map((zone) => zone.length));

const renderText = () => {
  const lines: string[] = [];
  lines.push(`Dependency graph of src/ — ${files.length} files, ${edges.length} internal imports`);
  lines.push("");
  lines.push("Zones");
  for (const group of [
    { title: "features", members: featureZones },
    { title: "layers", members: otherZones },
  ]) {
    lines.push(
      `  ${group.title}: ${group.members
        .map((zone) => `${zone} (${zoneFileCounts.get(zone) ?? 0})`)
        .join(", ")}`,
    );
  }
  lines.push("");
  lines.push("Edges, with the number of file imports behind each");
  for (const group of [
    { title: "Features", members: featureZones },
    { title: "Layers", members: otherZones },
  ]) {
    lines.push(`  ${group.title}`);
    for (const zone of group.members) {
      const targets = targetsOf(zone);
      const rendered =
        targets.length === 0
          ? "(imports nothing)"
          : targets.map((target) => `${target} ${edgeCount(zone, target)}`).join("  ");
      lines.push(`    ${pad(zone, nameWidth)} ──► ${rendered}`);
    }
  }
  lines.push("");
  lines.push("Imported by");
  for (const zone of sortedZones) {
    const importers = importersOf(zone);
    lines.push(
      `  ${pad(zone, nameWidth)} ◄── ${importers.length === 0 ? "(nothing)" : importers.join(", ")}`,
    );
  }
  return lines.join("\n");
};

const mermaidId = (zone: string) => zone.replace(/[^A-Za-z0-9_]/g, "_");

const renderMermaid = () => {
  const lines: string[] = ["```mermaid", "graph LR"];
  const declare = (zone: string) => {
    const count = zoneFileCounts.get(zone) ?? 0;
    return `    ${mermaidId(zone)}["${zone}<br/>${count} ${count === 1 ? "file" : "files"}"]`;
  };
  lines.push("  subgraph Features");
  for (const zone of featureZones) lines.push(declare(zone));
  lines.push("  end");
  lines.push("  subgraph Layers");
  for (const zone of otherZones) lines.push(declare(zone));
  lines.push("  end");
  for (const zone of sortedZones) {
    for (const target of targetsOf(zone)) {
      lines.push(`  ${mermaidId(zone)} -->|${edgeCount(zone, target)}| ${mermaidId(target)}`);
    }
  }
  lines.push("  classDef feature fill:#eef6ff,stroke:#3b82f6;");
  lines.push("  classDef layer fill:#f6f6f6,stroke:#9ca3af;");
  if (featureZones.length > 0) {
    lines.push(`  class ${featureZones.map(mermaidId).join(",")} feature;`);
  }
  if (otherZones.length > 0) lines.push(`  class ${otherZones.map(mermaidId).join(",")} layer;`);
  lines.push("```");
  return lines.join("\n");
};

const wantsMermaid = process.argv.includes("--mermaid");
const wantsQuiet = process.argv.includes("--quiet");

if (wantsMermaid) console.log(renderMermaid());
else if (!wantsQuiet) console.log(renderText());

const problems: string[] = [];

if (unresolved.length > 0) {
  problems.push("");
  problems.push(`Unresolved internal imports (${unresolved.length})`);
  for (const entry of unresolved) {
    problems.push(`  ${shortPath(entry.from)} → ${entry.specifier}`);
  }
}

if (fileCycles.length > 0) {
  problems.push("");
  problems.push(`FAIL — ${fileCycles.length} file-level cycle(s)`);
  for (const cycle of fileCycles) {
    problems.push(`  ${cycle.path.map(shortPath).join("\n    → ")}`);
    if (cycle.group.length > cycle.path.length - 1) {
      problems.push(`    entangled group: ${cycle.group.map(shortPath).join(", ")}`);
    }
  }
}

if (zoneCycles.length > 0) {
  problems.push("");
  problems.push(`FAIL — ${zoneCycles.length} zone-level cycle(s)`);
  for (const cycle of zoneCycles) {
    problems.push(`  ${cycle.path.join(" → ")}`);
    if (cycle.group.length > cycle.path.length - 1) {
      problems.push(`    entangled group: ${cycle.group.join(", ")}`);
    }
  }
}

if (violations.length > 0) {
  const byRule = new Map<string, Violation[]>();
  for (const violation of violations) {
    byRule.set(violation.rule, [...(byRule.get(violation.rule) ?? []), violation]);
  }
  problems.push("");
  problems.push(`FAIL — ${violations.length} rule violation(s)`);
  for (const [rule, entries] of [...byRule].sort((a, b) => a[0].localeCompare(b[0]))) {
    problems.push(`  ${rule}`);
    for (const entry of entries) {
      problems.push(`    ${shortPath(entry.from)} → ${entry.specifier}`);
    }
  }
}

const failed = fileCycles.length > 0 || zoneCycles.length > 0 || violations.length > 0;

if (problems.length > 0) console.log(problems.join("\n"));
if (!failed && !wantsMermaid) console.log("\nNo cycles. All layering rules pass.");

if (failed) process.exit(1);

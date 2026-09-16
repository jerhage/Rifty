import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

const sourceRoot = resolve("src");
const featureImportAllowances: Record<string, readonly string[]> = {
  annotation: ["annotation"],
  set: ["set"],
  card: ["card", "set"],
  analysis: ["analysis", "card"],
  catalog: ["catalog", "card", "set"],
  deck: ["deck", "card", "analysis"],
  rules: ["rules", "annotation"],
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

const featureTargetsOf = (feature: string) =>
  targetsOf(feature).filter((target) => featureZoneNames.has(target));

const featureEdges = new Map<string, Set<string>>();
for (const feature of featureZones) featureEdges.set(feature, new Set(featureTargetsOf(feature)));

const featureCycles = tarjanCycles(featureZones, featureEdges);
const featuresAreAcyclic = featureCycles.length === 0;

const featureDepths = () => {
  const depths = new Map<string, number>();
  const visit = (feature: string): number => {
    const cached = depths.get(feature);
    if (cached !== undefined) return cached;
    let deepest = 0;
    for (const target of featureEdges.get(feature) ?? [])
      deepest = Math.max(deepest, visit(target) + 1);
    depths.set(feature, deepest);
    return deepest;
  };
  for (const feature of featureZones) visit(feature);
  return depths;
};

const orderedFeatures = (() => {
  if (!featuresAreAcyclic) return [...featureZones].sort((a, b) => a.localeCompare(b));
  const depths = featureDepths();
  return [...featureZones].sort(
    (a, b) => (depths.get(b) ?? 0) - (depths.get(a) ?? 0) || a.localeCompare(b),
  );
})();

const renderFeatureList = (reason: string | undefined) => {
  const width = Math.max(...orderedFeatures.map((feature) => feature.length));
  const lines: string[] = [];
  if (reason !== undefined) {
    lines.push(reason);
    lines.push("");
  }
  for (const feature of orderedFeatures) {
    const targets = featureTargetsOf(feature);
    lines.push(
      `  ${pad(feature, width)} ──► ${targets.length === 0 ? "(nothing)" : targets.join(", ")}`,
    );
  }
  return lines.join("\n");
};

const north = 1;
const east = 2;
const south = 4;
const west = 8;
const laneGap = 6;
const dummyGap = 3;
const drawingMargin = 2;
const drawingWidthLimit = 100;

const boxCharacters = new Map<number, string>([
  [north, "│"],
  [south, "│"],
  [north | south, "│"],
  [east, "─"],
  [west, "─"],
  [east | west, "─"],
  [south | east, "┌"],
  [south | west, "┐"],
  [north | east, "└"],
  [north | west, "┘"],
  [north | south | east, "├"],
  [north | south | west, "┤"],
  [south | east | west, "┬"],
  [north | east | west, "┴"],
  [north | south | east | west, "┼"],
]);

type DrawingNode = {
  readonly id: string;
  readonly layer: number;
  readonly label: string;
  readonly isDummy: boolean;
  readonly width: number;
  readonly seedRank: number;
  readonly seedName: string;
  readonly sources: string[];
  readonly targets: string[];
};

type Arrival = {
  readonly target: string;
  readonly kind: "vertical" | "bus" | "fromLeft" | "fromRight";
  readonly ports: readonly number[];
};

const median = (values: readonly number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const half = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[half] ?? 0;
  return Math.round(((sorted[half - 1] ?? 0) + (sorted[half] ?? 0)) / 2);
};

const layerNumbers = (
  order: readonly string[],
  edges: ReadonlyMap<string, ReadonlySet<string>>,
) => {
  const importers = new Map<string, string[]>();
  for (const node of order) importers.set(node, []);
  for (const node of order) {
    for (const target of edges.get(node) ?? []) importers.get(target)?.push(node);
  }
  const layers = new Map<string, number>();
  const visit = (node: string): number => {
    const known = layers.get(node);
    if (known !== undefined) return known;
    let deepest = 0;
    for (const importer of importers.get(node) ?? []) {
      deepest = Math.max(deepest, visit(importer) + 1);
    }
    layers.set(node, deepest);
    return deepest;
  };
  for (const node of order) visit(node);
  return layers;
};

const buildDrawingNodes = (
  order: readonly string[],
  edges: ReadonlyMap<string, ReadonlySet<string>>,
) => {
  const layers = layerNumbers(order, edges);
  const nodes = new Map<string, DrawingNode>();
  const add = (node: Omit<DrawingNode, "sources" | "targets">) =>
    nodes.set(node.id, { ...node, sources: [], targets: [] });
  order.forEach((node, index) =>
    add({
      id: node,
      layer: layers.get(node) ?? 0,
      label: node,
      isDummy: false,
      width: node.length,
      seedRank: index,
      seedName: "",
    }),
  );
  const link = (from: string, to: string) => {
    nodes.get(from)?.targets.push(to);
    nodes.get(to)?.sources.push(from);
  };
  order.forEach((source, index) => {
    for (const target of [...(edges.get(source) ?? [])].sort()) {
      const start = layers.get(source) ?? 0;
      const finish = layers.get(target) ?? 0;
      let previous = source;
      for (let level = start + 1; level < finish; level += 1) {
        const id = `${source}>${target}#${level}`;
        add({
          id,
          layer: level,
          label: "",
          isDummy: true,
          width: 1,
          seedRank: index,
          seedName: target,
        });
        link(previous, id);
        previous = id;
      }
      link(previous, target);
    }
  });
  return nodes;
};

const orderLayers = (nodes: ReadonlyMap<string, DrawingNode>) => {
  const depth = Math.max(...[...nodes.values()].map((node) => node.layer)) + 1;
  const layers: string[][] = [];
  for (let level = 0; level < depth; level += 1) {
    layers.push(
      [...nodes.values()]
        .filter((node) => node.layer === level)
        .sort(
          (a, b) =>
            a.seedRank - b.seedRank ||
            Number(a.isDummy) - Number(b.isDummy) ||
            a.seedName.localeCompare(b.seedName) ||
            a.id.localeCompare(b.id),
        )
        .map((node) => node.id),
    );
  }
  const positions = (level: number) =>
    new Map((layers[level] ?? []).map((id, index) => [id, index]));

  const crossings = () => {
    let total = 0;
    for (let level = 0; level + 1 < layers.length; level += 1) {
      const upper = positions(level);
      const lower = positions(level + 1);
      const pairs: (readonly [number, number])[] = [];
      for (const id of layers[level] ?? []) {
        for (const target of nodes.get(id)?.targets ?? []) {
          const from = upper.get(id);
          const to = lower.get(target);
          if (from !== undefined && to !== undefined) pairs.push([from, to]);
        }
      }
      for (let a = 0; a < pairs.length; a += 1) {
        for (let b = a + 1; b < pairs.length; b += 1) {
          const first = pairs[a];
          const second = pairs[b];
          if (first === undefined || second === undefined) continue;
          if ((first[0] - second[0]) * (first[1] - second[1]) < 0) total += 1;
        }
      }
    }
    return total;
  };

  const sweep = (downward: boolean) => {
    const levels = [...layers.keys()].slice(1);
    for (const level of downward ? levels : [...levels].reverse()) {
      const reference = positions(downward ? level - 1 : level + 1);
      const current = positions(level);
      const members = layers[level] ?? [];
      const keyOf = (id: string) => {
        const node = nodes.get(id);
        const neighbors = (downward ? node?.sources : node?.targets) ?? [];
        const values = neighbors
          .map((neighbor) => reference.get(neighbor))
          .filter((value): value is number => value !== undefined);
        if (values.length === 0) return current.get(id) ?? 0;
        return values.reduce((sum, value) => sum + value, 0) / values.length;
      };
      layers[level] = [...members].sort(
        (a, b) => keyOf(a) - keyOf(b) || (current.get(a) ?? 0) - (current.get(b) ?? 0),
      );
    }
  };

  let best = layers.map((members) => [...members]);
  let fewest = crossings();
  for (let pass = 0; pass < 8 && layers.length > 1; pass += 1) {
    sweep(pass % 2 === 0);
    const measured = crossings();
    if (measured < fewest) {
      fewest = measured;
      best = layers.map((members) => [...members]);
    }
  }
  for (let level = 0; level < layers.length; level += 1) layers[level] = best[level] ?? [];
  return { layers, crossings: fewest };
};

const laneLayout = (width: number, ports: readonly number[]) => {
  if (ports.length === 0) return { offsets: [] as number[], left: undefined };
  let bestStart = 0;
  let bestEnd = 0;
  let start = 0;
  for (let end = 0; end < ports.length; end += 1) {
    while ((ports[end] ?? 0) - (ports[start] ?? 0) > width - 1) start += 1;
    if (end - start > bestEnd - bestStart) {
      bestStart = start;
      bestEnd = end;
    }
  }
  const first = ports[bestStart] ?? 0;
  const last = ports[bestEnd] ?? 0;
  const left = first - Math.floor((width - 1 - (last - first)) / 2);
  return { offsets: ports.map((port) => Math.min(width - 1, Math.max(0, port - left))), left };
};

const assignColumns = (nodes: ReadonlyMap<string, DrawingNode>, layers: readonly string[][]) => {
  const lefts = new Map<string, number>();
  const offsets = new Map<string, Map<string, number>>();
  const widthOf = (id: string) => nodes.get(id)?.width ?? 1;
  const centerOf = (id: string) => Math.floor((widthOf(id) - 1) / 2);
  const leftOf = (id: string) => lefts.get(id) ?? drawingMargin;
  const portOf = (id: string) => leftOf(id) + centerOf(id);
  const laneOf = (source: string, target: string) =>
    leftOf(source) + (offsets.get(source)?.get(target) ?? centerOf(source));
  const separation = (before: string, after: string) =>
    widthOf(before) +
    (nodes.get(before)?.isDummy === true && nodes.get(after)?.isDummy === true
      ? dummyGap
      : laneGap);
  const orderedTargets = (node: DrawingNode) => {
    const below = new Map((layers[node.layer + 1] ?? []).map((id, index) => [id, index]));
    return [...node.targets].sort(
      (a, b) =>
        portOf(a) - portOf(b) || (below.get(a) ?? 0) - (below.get(b) ?? 0) || a.localeCompare(b),
    );
  };
  const laneLayoutOf = (node: DrawingNode) => {
    const targets = orderedTargets(node);
    return { targets, ...laneLayout(node.width, targets.map(portOf)) };
  };
  const relane = () => {
    for (const node of nodes.values()) {
      const { targets, offsets: lanes } = laneLayoutOf(node);
      offsets.set(node.id, new Map(targets.map((target, index) => [target, lanes[index] ?? 0])));
    }
  };
  for (const members of layers) {
    let cursor = drawingMargin;
    members.forEach((id, index) => {
      lefts.set(id, cursor);
      cursor += separation(id, members[index + 1] ?? id);
    });
  }
  relane();

  const placeLayer = (level: number, downward: boolean) => {
    const members = layers[level] ?? [];
    const desired = new Map<string, number>();
    for (const id of members) {
      const node = nodes.get(id);
      if (node === undefined) continue;
      if (!downward && node.isDummy) continue;
      if (downward) {
        const wanted = node.sources.map((source) => laneOf(source, id) - centerOf(id));
        if (wanted.length > 0) desired.set(id, median(wanted));
        continue;
      }
      const wanted = laneLayoutOf(node).left;
      if (wanted !== undefined) desired.set(id, wanted);
    }
    const settled = new Set<number>();
    const byPriority = [...members.keys()].sort(
      (a, b) => priorityOf(members[b] ?? "") - priorityOf(members[a] ?? "") || a - b,
    );
    for (const index of byPriority) {
      const id = members[index];
      if (id === undefined) continue;
      const want = desired.get(id);
      if (want === undefined) {
        settled.add(index);
        continue;
      }
      let lowest = Number.MIN_SAFE_INTEGER;
      for (let before = index - 1; before >= 0; before -= 1) {
        if (!settled.has(before)) continue;
        let bound = leftOf(members[before] ?? "");
        for (let step = before; step < index; step += 1) {
          bound += separation(members[step] ?? "", members[step + 1] ?? "");
        }
        lowest = bound;
        break;
      }
      let highest = Number.MAX_SAFE_INTEGER;
      for (let after = index + 1; after < members.length; after += 1) {
        if (!settled.has(after)) continue;
        let bound = leftOf(members[after] ?? "");
        for (let step = index; step < after; step += 1) {
          bound -= separation(members[step] ?? "", members[step + 1] ?? "");
        }
        highest = bound;
        break;
      }
      lefts.set(id, Math.min(Math.max(want, lowest), Math.max(highest, lowest)));
      for (let after = index + 1; after < members.length; after += 1) {
        const previous = members[after - 1] ?? "";
        const current = members[after] ?? "";
        const minimum = leftOf(previous) + separation(previous, current);
        if (leftOf(current) < minimum) lefts.set(current, minimum);
      }
      for (let before = index - 1; before >= 0; before -= 1) {
        const next = members[before + 1] ?? "";
        const current = members[before] ?? "";
        const maximum = leftOf(next) - separation(current, next);
        if (leftOf(current) > maximum) lefts.set(current, maximum);
      }
      settled.add(index);
    }
  };

  const priorityOf = (id: string) => {
    const node = nodes.get(id);
    if (node === undefined) return 0;
    return node.isDummy ? Number.MAX_SAFE_INTEGER : node.sources.length + node.targets.length;
  };

  const levels = [...layers.keys()];
  for (let pass = 0; pass < 24; pass += 1) {
    for (const level of [...levels].reverse()) placeLayer(level, false);
    relane();
    for (const level of levels) placeLayer(level, true);
    relane();
  }
  const smallest = Math.min(...lefts.values());
  for (const [id, value] of lefts) lefts.set(id, value + drawingMargin - smallest);
  return { lefts, offsets };
};

const planArrivals = (
  nodes: ReadonlyMap<string, DrawingNode>,
  layers: readonly string[][],
  lefts: ReadonlyMap<string, number>,
  offsets: ReadonlyMap<string, ReadonlyMap<string, number>>,
) => {
  const leftOf = (id: string) => lefts.get(id) ?? drawingMargin;
  const widthOf = (id: string) => nodes.get(id)?.width ?? 1;
  const centerOf = (id: string) => Math.floor((widthOf(id) - 1) / 2);
  const portOf = (id: string) => leftOf(id) + centerOf(id);
  const laneOf = (source: string, target: string) =>
    leftOf(source) + (offsets.get(source)?.get(target) ?? centerOf(source));
  const plans: Arrival[][] = [];
  for (let level = 0; level + 1 < layers.length; level += 1) {
    const members = layers[level + 1] ?? [];
    const occupant = new Map<number, string>();
    for (const id of members) {
      if (nodes.get(id)?.isDummy === true) {
        occupant.set(portOf(id), id);
        continue;
      }
      for (let column = leftOf(id); column < leftOf(id) + widthOf(id); column += 1) {
        occupant.set(column, id);
      }
    }
    const arrivals: Arrival[] = [];
    for (const id of members) {
      const node = nodes.get(id);
      if (node === undefined || node.sources.length === 0) continue;
      const lanes = [...new Set(node.sources.map((source) => laneOf(source, id)))].sort(
        (a, b) => a - b,
      );
      const start = leftOf(id);
      const finish = start + widthOf(id) - 1;
      const runIsClear = (from: number, to: number, own: readonly number[]) => {
        for (let column = from; column <= to; column += 1) {
          const holder = occupant.get(column);
          if (holder === undefined) continue;
          const held = nodes.get(holder);
          if (
            own.includes(column) &&
            held?.isDummy === true &&
            held.sources.some((source) => laneOf(source, holder) === column)
          ) {
            continue;
          }
          return false;
        }
        return true;
      };
      const fromLeft = node.isDummy ? [] : lanes.filter((lane) => lane <= start - 3);
      const fromRight = node.isDummy ? [] : lanes.filter((lane) => lane >= finish + 3);
      const overhead = lanes.filter(
        (lane) => !fromLeft.includes(lane) && !fromRight.includes(lane),
      );
      const spilled: number[] = [];
      if (fromLeft.length > 0 && runIsClear(fromLeft[0] ?? 0, start - 1, fromLeft)) {
        arrivals.push({ target: id, kind: "fromLeft", ports: fromLeft });
      } else spilled.push(...fromLeft);
      if (
        fromRight.length > 0 &&
        runIsClear(finish + 1, fromRight[fromRight.length - 1] ?? 0, fromRight)
      ) {
        arrivals.push({ target: id, kind: "fromRight", ports: fromRight });
      } else spilled.push(...fromRight);
      const remaining = [...new Set([...overhead, ...spilled])].sort((a, b) => a - b);
      if (remaining.length === 0) continue;
      if (remaining.length === 1 && remaining[0] === portOf(id)) {
        arrivals.push({ target: id, kind: "vertical", ports: remaining });
        continue;
      }
      arrivals.push({ target: id, kind: "bus", ports: remaining });
    }
    plans.push(arrivals);
  }
  return plans;
};

const packBusRows = (arrivals: readonly Arrival[], portOf: (id: string) => number) => {
  const rows = new Map<Arrival, number>();
  const taken: { from: number; to: number }[][] = [];
  for (const bus of arrivals.filter((arrival) => arrival.kind === "bus")) {
    const columns = [...bus.ports, portOf(bus.target)];
    const span = { from: Math.min(...columns), to: Math.max(...columns) };
    let row = 0;
    while (
      (taken[row] ?? []).some((other) => span.from <= other.to + 1 && other.from <= span.to + 1)
    ) {
      row += 1;
    }
    taken[row] = [...(taken[row] ?? []), span];
    rows.set(bus, row);
  }
  return { rows, count: taken.length };
};

const renderFeatureDrawing = (): { drawing: string; crossings: number } | { reason: string } => {
  const nodes = buildDrawingNodes(orderedFeatures, featureEdges);
  const { layers, crossings } = orderLayers(nodes);
  const { lefts, offsets } = assignColumns(nodes, layers);
  const leftOf = (id: string) => lefts.get(id) ?? drawingMargin;
  const widthOf = (id: string) => nodes.get(id)?.width ?? 1;
  const portOf = (id: string) => leftOf(id) + Math.floor((widthOf(id) - 1) / 2);
  const plans = planArrivals(nodes, layers, lefts, offsets);
  const packed = plans.map((arrivals) => packBusRows(arrivals, portOf));
  const bandRows = packed.map(({ count }) => (count === 0 ? 1 : count + 2));
  const labelRows: number[] = [0];
  for (const rows of bandRows) labelRows.push((labelRows[labelRows.length - 1] ?? 0) + rows + 1);

  const masks = new Map<string, number>();
  const glyphs = new Map<string, string>();
  const cell = (row: number, column: number) => `${row}:${column}`;
  const connect = (row: number, column: number, bits: number) =>
    masks.set(cell(row, column), (masks.get(cell(row, column)) ?? 0) | bits);
  const vertical = (column: number, fromRow: number, toRow: number, continues: boolean) => {
    for (let row = fromRow; row <= toRow; row += 1) {
      connect(row, column, north | (row < toRow || continues ? south : 0));
    }
  };
  const horizontal = (row: number, fromColumn: number, toColumn: number) => {
    for (let column = fromColumn; column <= toColumn; column += 1) {
      connect(row, column, (column > fromColumn ? west : 0) | (column < toColumn ? east : 0));
    }
  };

  for (const members of layers) {
    for (const id of members) {
      const node = nodes.get(id);
      if (node === undefined) continue;
      const row = labelRows[node.layer] ?? 0;
      if (node.isDummy) {
        connect(row, portOf(id), north | south);
        continue;
      }
      [...node.label].forEach((character, offset) =>
        glyphs.set(cell(row, leftOf(id) + offset), character),
      );
    }
  }

  for (let level = 0; level + 1 < layers.length; level += 1) {
    const top = (labelRows[level] ?? 0) + 1;
    const bottom = (labelRows[level + 1] ?? 0) - 1;
    const targetRow = labelRows[level + 1] ?? 0;
    const busRows = packed[level]?.rows ?? new Map<Arrival, number>();
    for (const arrival of plans[level] ?? []) {
      if (arrival.kind === "vertical") {
        vertical(arrival.ports[0] ?? 0, top, bottom, true);
        continue;
      }
      if (arrival.kind === "bus") {
        const row = top + 1 + (busRows.get(arrival) ?? 0);
        const columns = [...arrival.ports, portOf(arrival.target)];
        for (const lane of arrival.ports) vertical(lane, top, row, false);
        horizontal(row, Math.min(...columns), Math.max(...columns));
        connect(row, portOf(arrival.target), south);
        vertical(portOf(arrival.target), row + 1, bottom, true);
        continue;
      }
      const facingLeft = arrival.kind === "fromLeft";
      const arrowColumn = facingLeft
        ? leftOf(arrival.target) - 2
        : leftOf(arrival.target) + widthOf(arrival.target) + 1;
      const outer = facingLeft ? Math.min(...arrival.ports) : Math.max(...arrival.ports);
      const inner = facingLeft ? arrowColumn - 1 : arrowColumn + 1;
      for (const lane of arrival.ports) vertical(lane, top, targetRow, false);
      horizontal(targetRow, Math.min(outer, inner), Math.max(outer, inner));
      for (const lane of arrival.ports) {
        connect(
          targetRow,
          lane,
          facingLeft ? east | (lane > outer ? west : 0) : west | (lane < outer ? east : 0),
        );
      }
      connect(targetRow, inner, facingLeft ? east : west);
      glyphs.set(cell(targetRow, arrowColumn), facingLeft ? "►" : "◄");
    }
  }

  const totalRows = (labelRows[labelRows.length - 1] ?? 0) + 1;
  const marked = [...masks.keys(), ...glyphs.keys()];
  const totalColumns = Math.max(0, ...marked.map((entry) => Number(entry.split(":")[1]))) + 1;
  if (totalColumns > drawingWidthLimit) {
    return {
      reason: `The drawing would need ${totalColumns} columns, past the ${drawingWidthLimit}-column limit — listing the edges instead.`,
    };
  }
  const lines: string[] = [];
  for (let row = 0; row < totalRows; row += 1) {
    let line = "";
    for (let column = 0; column < totalColumns; column += 1) {
      line +=
        glyphs.get(cell(row, column)) ??
        boxCharacters.get(masks.get(cell(row, column)) ?? 0) ??
        " ";
    }
    lines.push(line.replace(/[ ]+$/, ""));
  }
  return { drawing: lines.join("\n"), crossings };
};

const renderSimple = () => {
  const lines: string[] = [];
  lines.push(
    `${featureZones.length} features — ${
      featuresAreAcyclic
        ? "a DAG, no cycles"
        : `not a DAG, ${featureCycles.length} cycle(s) between features`
    }`,
  );
  lines.push("");
  if (!featuresAreAcyclic || featureZones.length === 0) lines.push(renderFeatureList(undefined));
  else {
    const drawn = renderFeatureDrawing();
    lines.push("drawing" in drawn ? drawn.drawing : renderFeatureList(drawn.reason));
  }
  lines.push("");
  lines.push(
    featuresAreAcyclic
      ? "Everything above depends on what is below."
      : `Listed alphabetically — a cycle leaves no such order: ${featureCycles
          .map((cycle) => cycle.path.join(" → "))
          .join("; ")}`,
  );
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

const renderFeatureMermaid = () => {
  const lines: string[] = ["```mermaid", "graph LR"];
  for (const feature of orderedFeatures) lines.push(`  ${mermaidId(feature)}["${feature}"]`);
  for (const feature of orderedFeatures) {
    for (const target of featureTargetsOf(feature)) {
      lines.push(`  ${mermaidId(feature)} --> ${mermaidId(target)}`);
    }
  }
  lines.push("```");
  return lines.join("\n");
};

const wantsMermaid = process.argv.includes("--mermaid");
const wantsFull = process.argv.includes("--full");
const wantsQuiet = process.argv.includes("--quiet");

if (wantsMermaid) console.log(wantsFull ? renderMermaid() : renderFeatureMermaid());
else if (!wantsQuiet) console.log(wantsFull ? renderText() : renderSimple());

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

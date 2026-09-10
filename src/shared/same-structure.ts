function sameStructure(left: unknown, right: unknown): boolean {
  if (left === right) return true;

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length && left.every((item, index) => sameStructure(item, right[index]))
    );
  }

  if (isRecord(left) && isRecord(right)) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);

    return [...keys].every((key) => sameStructure(left[key], right[key]));
  }

  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export { sameStructure };

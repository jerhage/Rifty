function shuffle<Item>(items: readonly Item[], nextRandom: () => number): readonly Item[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(nextRandom() * (index + 1));
    const held = shuffled[index];
    shuffled[index] = shuffled[target];
    shuffled[target] = held;
  }

  return shuffled;
}

export { shuffle };

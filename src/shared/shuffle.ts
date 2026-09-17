function shuffle<Item>(items: readonly Item[], nextRandom: () => number): readonly Item[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(nextRandom() * (index + 1));
    const held = shuffled.slice(index, index + 1);
    const drawn = shuffled.slice(target, target + 1);

    shuffled.splice(index, 1, ...drawn);
    shuffled.splice(target, 1, ...held);
  }

  return shuffled;
}

export { shuffle };

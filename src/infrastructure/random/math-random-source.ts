import type { RandomSource } from "@/application/ports/random-source";

class MathRandomSource implements RandomSource {
  next(): number {
    return Math.random();
  }
}

export { MathRandomSource };

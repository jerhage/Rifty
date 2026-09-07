import type { Clock } from "@/application/ports/clock";

/** Reads the device clock. */
class SystemClock implements Clock {
  now(): string {
    return new Date().toISOString();
  }
}

export { SystemClock };

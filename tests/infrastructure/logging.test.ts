import type { Logger, LogMetadata } from "@/application/ports/logger";
import { DrizzleLoggerAdapter } from "@/infrastructure/drizzle/drizzle-logger-adapter";
import { NoopLogger } from "@/infrastructure/logging/noop-logger";
import { withQueryLogging } from "@/infrastructure/logging/with-query-logging";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly metadata: LogMetadata | undefined;
}

class MemoryLogger implements Logger {
  readonly entries: LogEntry[] = [];

  debug(message: string, metadata?: LogMetadata): void {
    this.entries.push({ level: "debug", message, metadata });
  }

  info(message: string, metadata?: LogMetadata): void {
    this.entries.push({ level: "info", message, metadata });
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.entries.push({ level: "warn", message, metadata });
  }

  error(message: string, metadata?: LogMetadata): void {
    this.entries.push({ level: "error", message, metadata });
  }
}

describe("query logging", () => {
  it("logs an async repository call, its duration, and an array result count", async () => {
    const logger = new MemoryLogger();
    const repository = withQueryLogging(
      {
        async getMany(prefix: string): Promise<string[]> {
          return [`${prefix}-one`, `${prefix}-two`];
        },
      },
      logger,
      "ExampleRepository",
    );

    await expect(repository.getMany("card")).resolves.toEqual(["card-one", "card-two"]);
    expect(logger.entries).toEqual([
      {
        level: "debug",
        message: "ExampleRepository.getMany called",
        metadata: { args: ["card"] },
      },
      {
        level: "info",
        message: "ExampleRepository.getMany succeeded",
        metadata: {
          durationMs: expect.any(Number),
          resultCount: 2,
        },
      },
    ]);
  });

  it("logs a failed repository call with its duration and rethrows the error", async () => {
    const logger = new MemoryLogger();
    const failure = new Error("database unavailable");
    const repository = withQueryLogging(
      {
        async getOne(): Promise<never> {
          throw failure;
        },
      },
      logger,
      "ExampleRepository",
    );

    await expect(repository.getOne()).rejects.toThrow(failure);
    expect(logger.entries).toEqual([
      {
        level: "debug",
        message: "ExampleRepository.getOne called",
        metadata: { args: [] },
      },
      {
        level: "error",
        message: "ExampleRepository.getOne failed",
        metadata: {
          durationMs: expect.any(Number),
          error: failure,
        },
      },
    ]);
  });

  it("adapts Drizzle query logging without adding a duration", () => {
    const logger = new MemoryLogger();
    const adapter = new DrizzleLoggerAdapter(logger);

    adapter.logQuery("select * from catalog_card where id = ?", ["card-1"]);

    expect(logger.entries).toEqual([
      {
        level: "debug",
        message: "SQL query executed",
        metadata: {
          params: ["card-1"],
          query: "select * from catalog_card where id = ?",
        },
      },
    ]);
  });

  it("provides a logger that is safe to use in tests without output", () => {
    const logger = new NoopLogger();

    expect(() => logger.error("ignored", { reason: "test" })).not.toThrow();
  });
});

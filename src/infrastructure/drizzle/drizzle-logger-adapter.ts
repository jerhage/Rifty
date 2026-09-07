import type { Logger as DrizzleLogger } from "drizzle-orm/logger";

import type { Logger } from "@/application/ports/logger";

/** Adapts Drizzle's pre-execution query hook */
class DrizzleLoggerAdapter implements DrizzleLogger {
  constructor(private readonly logger: Logger) {}

  logQuery(query: string, params: unknown[]): void {
    this.logger.debug("SQL query executed", { params, query });
  }
}

export { DrizzleLoggerAdapter };

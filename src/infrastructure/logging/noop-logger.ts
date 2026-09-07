import type { Logger, LogMetadata } from "@/application/ports/logger";

/* Logger implementation meant for tests */
class NoopLogger implements Logger {
  debug(_message: string, _metadata?: LogMetadata): void {}

  info(_message: string, _metadata?: LogMetadata): void {}

  warn(_message: string, _metadata?: LogMetadata): void {}

  error(_message: string, _metadata?: LogMetadata): void {}
}

export { NoopLogger };

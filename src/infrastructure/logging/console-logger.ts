import type { Logger, LogMetadata } from "@/application/ports/logger";

class ConsoleLogger implements Logger {
  debug(message: string, metadata?: LogMetadata): void {
    console.debug(message, metadata ?? "");
  }

  info(message: string, metadata?: LogMetadata): void {
    console.info(message, metadata ?? "");
  }

  warn(message: string, metadata?: LogMetadata): void {
    console.warn(message, metadata ?? "");
  }

  error(message: string, metadata?: LogMetadata): void {
    console.error(message, metadata ?? "");
  }
}

export { ConsoleLogger };

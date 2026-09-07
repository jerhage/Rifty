type LogMetadata = Readonly<Record<string, unknown>>;

/** Records diagnostic events without coupling application code to a logging provider. */
interface Logger {
  debug(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  error(message: string, metadata?: LogMetadata): void;
}

export type { Logger, LogMetadata };

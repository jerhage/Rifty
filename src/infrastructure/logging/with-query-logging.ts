import type { Logger } from "@/application/ports/logger";

/**
 * Since we lack the ability to hook directly into when a query finishes running we settle for wrapping the repository method calls.
 * Performance measurements are not precise to the exact internal DB execution time, but it provides an estimat we can use for relative
 * query performance.
 *
 * @typeParam T - The type of the object being wrapped (e.g. likely a repository interface).
 * @param target - The concrete instance to wrap and proxy.
 * @param logger - The `Logger` port used to emit call/result/error logs.
 * @param label - Name used to prefix log messages
 *                (e.g. `"CardRepository"`), so logs read as `CardRepository.findById called`.
 * @returns A proxy of `target` with identical shape and behavior, plus logging.
 */
function withQueryLogging<T extends object>(target: T, logger: Logger, label: string): T {
  return new Proxy(target, {
    get(object, property, receiver) {
      const original = Reflect.get(object, property, receiver);
      if (typeof original !== "function") return original;

      return async (...args: unknown[]) => {
        const startedAt = performance.now();
        const method = `${label}.${String(property)}`;
        logger.debug(`${method} called`, { args });

        try {
          const result = await original.apply(object, args);
          logger.info(`${method} succeeded`, {
            durationMs: performance.now() - startedAt,
            resultCount: Array.isArray(result) ? result.length : undefined,
          });
          return result;
        } catch (error) {
          logger.error(`${method} failed`, {
            durationMs: performance.now() - startedAt,
            error,
          });
          throw error;
        }
      };
    },
  });
}

export { withQueryLogging };

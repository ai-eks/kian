const logWithDetails = (
  log: (message?: unknown, ...optionalParams: unknown[]) => void,
  level: string,
  message: string,
  details?: unknown,
): void => {
  const prefixedMessage = `[kian][${level}] ${message}`;
  if (details === undefined) {
    log(prefixedMessage);
    return;
  }

  log(prefixedMessage, details);
};

export const logger = {
  debug(message: string, details?: unknown): void {
    logWithDetails(console.debug, "debug", message, details);
  },
  info(message: string, details?: unknown): void {
    logWithDetails(console.info, "info", message, details);
  },
  warn(message: string, details?: unknown): void {
    logWithDetails(console.warn, "warn", message, details);
  },
  error(message: string, details?: unknown): void {
    logWithDetails(console.error, "error", message, details);
  },
};

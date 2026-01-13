export interface Logger {
  info(message: string, params?: Record<string, unknown>): void;
  warn(message: string, params?: Record<string, unknown>): void;
  error(message: string, params?: Record<string, unknown>): void;
  trace(message: string, params?: Record<string, unknown>): void;
  fatal(message: string, params?: Record<string, unknown>): void;
  debug(message: string, params?: Record<string, unknown>): void;
}

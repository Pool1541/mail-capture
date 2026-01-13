import { Logger } from "@/shared/domain/contracts/logger";
import * as Sentry from "@sentry/node";

export class SentryLogger implements Logger {
  constructor(private readonly logger: typeof Sentry.logger) {}

  info(message: string, params?: Record<string, unknown>): void {
    this.logger.info(message, params);
  }
  warn(message: string, params?: Record<string, unknown>): void {
    this.logger.warn(message, params);
  }
  error(message: string, params?: Record<string, unknown>): void {
    this.logger.error(message, params);
  }
  trace(message: string, params?: Record<string, unknown>): void {
    this.logger.trace(message, params);
  }
  fatal(message: string, params?: Record<string, unknown>): void {
    this.logger.fatal(message, params);
  }
  debug(message: string, params?: Record<string, unknown>): void {
    this.logger.debug(message, params);
  }
}

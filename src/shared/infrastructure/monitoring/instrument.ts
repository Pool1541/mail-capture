import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? "",
  tracesSampleRate: 1.0,
  serverName: process.env.SENTRY_SERVER_NAME ?? "unknown-server",
  environment: process.env.NODE_ENV ?? "development",
  enabled: process.env.SENTRY_ENABLED === "true" || false,
  enableLogs: process.env.SENTRY_ENABLE_LOGS === "true" || false,
});

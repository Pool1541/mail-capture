import * as Sentry from "@sentry/node";
import { createClient } from "@supabase/supabase-js";
import { SQSClient } from "@aws-sdk/client-sqs";

import { Database } from "./shared/infrastructure/types/supabase";
import { ScrapperWorker } from "@/result/infrastructure/workers/scrapper-worker";
import { SqsQueueService } from "./result/infrastructure/services/sqs-queue-service";
import { SupabaseResultRepository } from "./result/infrastructure/repositories/supabase-result-repository";
import { SupabaseUserRepository } from "./user/infrastructure/repositories/supabase-user-repository";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? "",
  tracesSampleRate: 1.0,
  serverName: process.env.SENTRY_SCRAPER_SERVER_NAME ?? "unknown-server",
  environment: process.env.NODE_ENV ?? "development",
  enabled: process.env.SENTRY_ENABLED === "true" || false,
  enableLogs: process.env.SENTRY_ENABLE_LOGS === "true" || false,
});

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

const QUEUE_URL = process.env.SQS_SCRAPER_QUEUE_URL ?? "";
const MAX_NUMBER_OF_MESSAGES = 1;
const WAIT_TIME_SECONDS = 20;
const VISIBILITY_TIMEOUT = 180;

const scraperQueueService = new SqsQueueService(sqsClient, QUEUE_URL, MAX_NUMBER_OF_MESSAGES, WAIT_TIME_SECONDS, VISIBILITY_TIMEOUT);
const supabase = createClient<Database>(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_SERVICE_ROLE ?? "");
const resultRepository = new SupabaseResultRepository(supabase);
const userRepository = new SupabaseUserRepository(supabase);

const scrapperWorker = new ScrapperWorker(scraperQueueService, resultRepository, userRepository);

void scrapperWorker.start();

console.log("🚀 Scraper worker process started");

async function shutdown({ signal, error, reason }: { signal: string; error?: Error; reason?: unknown }): Promise<void> {
  switch (signal) {
    case "SIGINT":
    case "SIGTERM":
      console.log(`Stopping scraper worker due to ${signal}...`);
      scrapperWorker.stop();
      await Sentry.close(2000);
      process.exit(0);
      break;
    case "uncaughtException":
      console.log("Stopping scraper worker due to uncaught exception...");
      Sentry.captureException(error);
      scrapperWorker.stop();
      await Sentry.close(2000);
      process.exit(1);
      break;
    case "unhandledRejection":
      console.log("Stopping scraper worker due to unhandled rejection...");
      Sentry.captureException(reason);
      scrapperWorker.stop();
      await Sentry.close(2000);
      process.exit(1);
      break;
    default:
      console.log(`Received unknown signal: ${signal}`);
      Sentry.captureException(error ?? reason ?? new Error("Unknown shutdown reason"));
      scrapperWorker.stop();
      await Sentry.close(2000);
      process.exit(1);
  }
}

process.on("SIGINT", () => {
  void shutdown({ signal: "SIGINT" });
});

process.on("SIGTERM", () => {
  void shutdown({ signal: "SIGTERM" });
});

process.on("uncaughtException", (error) => {
  void shutdown({ signal: "uncaughtException", error });
});

process.on("unhandledRejection", (reason) => {
  void shutdown({ signal: "unhandledRejection", reason });
});

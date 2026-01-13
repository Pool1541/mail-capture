import * as Sentry from "@sentry/node";
import { createClient } from "@supabase/supabase-js";
import { SQSClient } from "@aws-sdk/client-sqs";

import { type Database } from "@/shared/infrastructure/types/supabase";
import { OutlookService } from "@/result/infrastructure/services/outlook-service";
import { SqsQueueService } from "./result/infrastructure/services/sqs-queue-service";
import { ValidationWorker } from "@/result/infrastructure/workers/validation-worker";
import { SupabaseUserRepository } from "@/user/infrastructure/repositories/supabase-user-repository";
import { SupabaseResultRepository } from "@/result/infrastructure/repositories/supabase-result-repository";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? "",
  tracesSampleRate: 1.0,
  serverName: process.env.SENTRY_VALIDATION_SERVER_NAME ?? "unknown-server",
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

const QUEUE_URL = process.env.SQS_VALIDATION_QUEUE_URL ?? process.env.SQS_QUEUE_URL ?? "";
const MAX_NUMBER_OF_MESSAGES = 1;
const WAIT_TIME_SECONDS = 20;
const VISIBILITY_TIMEOUT = 60;

const SCRAPPER_QUEUE_URL = process.env.SQS_SCRAPER_QUEUE_URL ?? "";
const SCRAPPER_NUMBER_OF_MESSAGES = 1;
const SCRAPPER_WAIT_TIME_SECONDS = 20;
const SCRAPPER_VISIBILITY_TIMEOUT = 180;

// Inicializar dependencias
const supabase = createClient<Database>(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_SERVICE_ROLE ?? "");
const resultRepository = new SupabaseResultRepository(supabase);
const userRepository = new SupabaseUserRepository(supabase);
const outlookService = new OutlookService();
const validationQueueService = new SqsQueueService(sqsClient, QUEUE_URL, MAX_NUMBER_OF_MESSAGES, WAIT_TIME_SECONDS, VISIBILITY_TIMEOUT);
const scraperQueueService = new SqsQueueService(
  sqsClient,
  SCRAPPER_QUEUE_URL,
  SCRAPPER_NUMBER_OF_MESSAGES,
  SCRAPPER_WAIT_TIME_SECONDS,
  SCRAPPER_VISIBILITY_TIMEOUT,
);

// Crear e iniciar el worker de validación
const validationWorker = new ValidationWorker(validationQueueService, scraperQueueService, resultRepository, outlookService, userRepository);

void validationWorker.start();

console.log("🚀 Validation worker process started");

async function shutdown({ signal, error, reason }: { signal: string; error?: Error; reason?: unknown }): Promise<void> {
  switch (signal) {
    case "SIGINT":
    case "SIGTERM":
      console.log(`Stopping validation worker due to ${signal}...`);
      validationWorker.stop();
      await Sentry.close(2000);
      process.exit(0);
      break;
    case "uncaughtException":
      console.log("Stopping validation worker due to uncaught exception...");
      Sentry.captureException(error);
      validationWorker.stop();
      await Sentry.close(2000);
      process.exit(1);
      break;
    case "unhandledRejection":
      console.log("Stopping validation worker due to unhandled rejection...");
      Sentry.captureException(reason);
      validationWorker.stop();
      await Sentry.close(2000);
      process.exit(1);
      break;
    default:
      console.log(`Received unknown signal: ${signal}`);
      Sentry.captureException(error ?? reason ?? new Error("Unknown shutdown reason"));
      validationWorker.stop();
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

import * as Sentry from "@sentry/node";
import { Resend } from "resend";
import { SQSClient } from "@aws-sdk/client-sqs";
import { createClient } from "@supabase/supabase-js";

import { type Database } from "./types/supabase";

import { JwtService } from "@/auth/infrastructure/services/jwt-service";
import { SentryLogger } from "./services/sentry-logger";
import { SignUpWebhook } from "@/auth/application/use-cases/sign-up-webhook";
import { OutlookService } from "@/result/infrastructure/services/outlook-service";
import { SqsQueueService } from "@/result/infrastructure/services/sqs-queue-service";
import { SendWelcomeEmail } from "@/auth/application/use-cases/send-welcome-email";
import { CreateAccessToken } from "@/result/application/use-cases/create-access-token";
import { ResendEmailService } from "./services/resend-email-service";
import { ValidateAccessToken } from "@/auth/application/use-cases/validate-access-token";
import { RegisterInWhitelist } from "@/auth/application/use-cases/register-in-whitelist";
import { SupabaseUserRepository } from "@/user/infrastructure/repositories/supabase-user-repository";
import { ExpressResultController } from "@/result/infrastructure/express-result-controller";
import { SupabaseWebhookRepository } from "@/webhook/infrastructure/repositories/supabase-webhook-repository";
import { CreateEmailClientWebhookSubscription } from "@/result/application/use-cases/create-email-client-webhook-subscription";
import { CreateWebhook } from "@/webhook/application/use-cases/create-webhook";
import { RenewWebhook } from "@/webhook/application/use-cases/renew-webhook";
import { WebhookRenewalService } from "@/webhook/application/services/webhook-renewal-service";

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

const jwtService = new JwtService(process.env.SUPABASE_JWT_SECRET ?? "");

const supabase = createClient<Database>(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_SERVICE_ROLE ?? "");
const userRepository = new SupabaseUserRepository(supabase);
const webhookRepository = new SupabaseWebhookRepository(supabase);
const resend = new Resend(process.env.RESEND_API_KEY ?? "");
const emailService = new ResendEmailService(resend);
const registerInWhitelist = new RegisterInWhitelist(userRepository);
const sendWelcomeEmail = new SendWelcomeEmail(emailService);
const outlookService = new OutlookService();
const validationQueueService = new SqsQueueService(sqsClient, QUEUE_URL, MAX_NUMBER_OF_MESSAGES, WAIT_TIME_SECONDS, VISIBILITY_TIMEOUT);
const logger = new SentryLogger(Sentry.logger);

// Auth use-cases
const validateAccessToken = new ValidateAccessToken(jwtService);
const signUpWebhook = new SignUpWebhook(sendWelcomeEmail, registerInWhitelist);

// Result use-cases
const createAccessToken = new CreateAccessToken(outlookService);
const createEmailClientWebhookSubscription = new CreateEmailClientWebhookSubscription(outlookService);

// Webhook use-cases
const createWebhook = new CreateWebhook(outlookService, webhookRepository);
const renewWebhook = new RenewWebhook(outlookService, webhookRepository);

// Webhook services
const webhookRenewalService = new WebhookRenewalService(webhookRepository, renewWebhook, createWebhook);

// Controllers
const resultController = new ExpressResultController(logger, createAccessToken, validationQueueService, createEmailClientWebhookSubscription);

export const ServiceContainer = {
  auth: {
    validateAccessToken,
    signUpWebhook,
  },
  email: {
    emailService,
  },
  result: {
    createEmailClientWebhookSubscription,
    createAccessToken,
    validationQueueService,
  },
  webhook: {
    webhookRenewalService,
  },
  monitoring: {
    logger,
  },
  controllers: {
    resultController,
  },
};

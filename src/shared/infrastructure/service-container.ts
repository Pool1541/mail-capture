import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/node";

import { type Database } from "./types/supabase";

import { JwtService } from "@/auth/infrastructure/services/jwt-service";
import { SignUpWebhook } from "@/auth/application/use-cases/sign-up-webhook";
import { OutlookService } from "@/result/infrastructure/services/outlook-service";
import { ValidationQueueService } from "@/result/infrastructure/services/validation-queue-service";
import { ScraperQueueService } from "@/result/infrastructure/services/scraper-queue-service";
import { SendWelcomeEmail } from "@/auth/application/use-cases/send-welcome-email";
import { CreateAccessToken } from "@/result/application/use-cases/create-access-token";
import { SentryLogger } from "./services/sentry-logger";
import { ResendEmailService } from "./services/resend-email-service";
import { ValidateAccessToken } from "@/auth/application/use-cases/validate-access-token";
import { RegisterInWhitelist } from "@/auth/application/use-cases/register-in-whitelist";
import { SupabaseUserRepository } from "@/user/infrastructure/repositories/supabase-user-repository";
import { CreateEmailClientWebhookSubscription } from "@/result/application/use-cases/create-email-client-webhook-subscription";

const jwtService = new JwtService(process.env.SUPABASE_JWT_SECRET ?? "");

const supabase = createClient<Database>(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_SERVICE_ROLE ?? "");
const userRepository = new SupabaseUserRepository(supabase);
const resend = new Resend(process.env.RESEND_API_KEY ?? "");
const emailService = new ResendEmailService(resend);
const registerInWhitelist = new RegisterInWhitelist(userRepository);
const sendWelcomeEmail = new SendWelcomeEmail(emailService);
const outlookService = new OutlookService();
const validationQueueService = new ValidationQueueService();
const scraperQueueService = new ScraperQueueService();
const logger = new SentryLogger(Sentry.logger);

export const ServiceContainer = {
  auth: {
    validateAccessToken: new ValidateAccessToken(jwtService),
    signUpWebhook: new SignUpWebhook(sendWelcomeEmail, registerInWhitelist),
  },
  email: {
    emailService,
  },
  result: {
    createEmailClientWebhookSubscription: new CreateEmailClientWebhookSubscription(outlookService),
    createAccessToken: new CreateAccessToken(outlookService),
    validationQueueService,
    scraperQueueService,
  },
  monitoring: {
    logger,
  },
};

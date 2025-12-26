/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextFunction, Request, Response } from "express";
import { type CreateEmailClientWebhookSubscription } from "../application/use-cases/create-email-client-webhook-subscription";
import { type CreateAccessToken } from "../application/use-cases/create-access-token";
import { type INotification } from "../domain/contracts/notification";
import { type QueueService } from "../domain/contracts/queue-service";
import { type Logger } from "@/shared/domain/contracts/logger";

interface WebhookRequest extends Request {
  body: INotification;
}

export class ExpressResultController {
  constructor(
    private readonly logger: Logger,
    private readonly createAccessToken: CreateAccessToken,
    private readonly validationQueueService: QueueService,
    private readonly createEmailClientWebhookSubscription: CreateEmailClientWebhookSubscription,
  ) {}
  emailClientWebhook(req: WebhookRequest, res: Response, next: NextFunction) {
    try {
      const validationToken = req.query.validationToken as string | undefined;

      if (validationToken) {
        console.log({ validationToken });
        res.status(200).type("text/plain").send(validationToken);
        return;
      }

      console.log("Received webhook notification:", req.body.value);

      const { clientState, resourceData } = req.body.value[0];
      const messageId = resourceData.id;

      if (clientState !== process.env.OUTLOOK_CLIENT_STATE) {
        console.log("Invalid client state:", { clientState, expected: process.env.OUTLOOK_CLIENT_STATE });
        res.status(401).json({ message: "Invalid client state" });
        return;
      }

      // Solo enviar messageId a la cola de validación - responder inmediatamente
      this.validationQueueService.sendMessage({ messageId }).catch((error: unknown) => {
        this.logger.error("Error sending message to validation queue", { messageId, error });
      });

      this.logger.info("Webhook notification processed", {
        messageId,
        originalUrl: req.originalUrl,
        endpoint: `${req.method} ${req.baseUrl}`,
        timestamp: new Date().toISOString(),
      });

      res.status(202).json({ message: "Notification received" });
    } catch (error) {
      // Captura errores síncronos solamente (validación, parsing, etc.)
      this.logger.error("Synchronous error in webhook handler:", { error, messageId: req.body.value[0]?.resourceData.id ?? "unknown" });
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getAccessToken(req: Request, res: Response, next: NextFunction) {
    try {
      const accessToken = await this.createAccessToken.execute();
      res.status(200).json({ accessToken });
    } catch (error) {
      next(error);
    }
  }

  async requestWebhookSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const webhookSubscriptionData = await this.createEmailClientWebhookSubscription.execute();

      console.log(webhookSubscriptionData);

      res.status(200).json({ message: "Webhook subscription created successfully", data: webhookSubscriptionData });
    } catch (error) {
      next(error);
    }
  }
}

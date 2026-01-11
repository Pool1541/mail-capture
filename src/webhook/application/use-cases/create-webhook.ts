import { type IEmailClientService } from "@/result/domain/contracts/email-client-service";

import { WebhookRepository } from "@/webhook/domain/contracts/webhook-repository";
import { CreateWebhookResponse } from "@/webhook/domain/contracts/create-webhook-response";
import { WebhookEmailClient } from "@/webhook/domain/value-objects/email-client";
import { Webhook } from "@/webhook/domain/webhook";

export class CreateWebhook {
  private readonly endpoint = "https://graph.microsoft.com/v1.0/subscriptions";
  constructor(
    private readonly emailClientService: IEmailClientService,
    private readonly webhookRepository: WebhookRepository,
  ) {}

  async execute() {
    const fiveDaysFromNow = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    const payload = {
      changeType: "created",
      clientState: process.env.OUTLOOK_CLIENT_STATE ?? "",
      notificationUrl: process.env.OUTLOOK_NOTIFICATION_URL ?? "",
      resource: `users/${process.env.EMAIL ?? ""}/messages`,
      expirationDateTime: fiveDaysFromNow.toISOString(),
    };

    const accesToken = await this.emailClientService.getAccessToken();

    const requetInit: RequestInit = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accesToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    };

    try {
      const response = await fetch(this.endpoint, requetInit);

      if (!response.ok) {
        const errorData = (await response.json()) as unknown;
        console.log("MS webook error:", errorData);
        throw new Error(`Error creating webhook subscription: ${response.status.toString()} - ${response.statusText}`);
      }

      const webhookData = (await response.json()) as CreateWebhookResponse;

      const webhook = new Webhook({
        id: webhookData.id,
        client: new WebhookEmailClient("outlook"),
        notificationUrl: payload.notificationUrl,
        createdAt: new Date(),
        expirationDateTime: new Date(webhookData.expirationDateTime),
        resource: webhookData.resource,
        changeType: webhookData.changeType,
        active: true,
      });

      await this.webhookRepository.save(webhook);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error creating webhook subscription:", error.message);
        throw error;
      } else {
        console.error("An unexpected error occurred:", error);
        throw new Error("An unexpected error occurred while creating webhook subscription.");
      }
    }
  }
}

import { type IEmailClientService } from "@/result/domain/contracts/email-client-service";
import { UpdateWebhookResponse } from "@/webhook/domain/contracts/update-webhook-response";
import { WebhookRepository } from "@/webhook/domain/contracts/webhook-repository";
import { WebhookEmailClient } from "@/webhook/domain/value-objects/email-client";
import { Webhook } from "@/webhook/domain/webhook";

export class RenewWebhook {
  private readonly endpoint = "https://graph.microsoft.com/v1.0/subscriptions";
  constructor(
    private readonly emailClientService: IEmailClientService,
    private readonly webhookRepository: WebhookRepository,
  ) {}

  async execute(subscriptionId: string) {
    const newExpirationDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const payload = {
      expirationDateTime: newExpirationDate.toISOString(),
    };

    const accessToken = await this.emailClientService.getAccessToken();

    const requestInit: RequestInit = {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    };

    try {
      const response = await fetch(`${this.endpoint}/${subscriptionId}`, requestInit);

      if (!response.ok) {
        const errorData = (await response.json()) as unknown;
        console.log("MS webhook update error:", errorData);
        throw new Error(`Error updating webhook subscription: ${response.status.toString()} - ${response.statusText}`);
      }

      const webhookData = (await response.json()) as UpdateWebhookResponse;

      const webhook = new Webhook({
        id: webhookData.id,
        client: new WebhookEmailClient("outlook"),
        notificationUrl: webhookData.notificationUrl,
        createdAt: new Date(),
        expirationDateTime: new Date(webhookData.expirationDateTime),
        resource: webhookData.resource,
        changeType: webhookData.changeType,
        active: true,
      });

      await this.webhookRepository.update(webhook);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error updating webhook subscription, creating a new one instead:", error.message);
        throw error;
      } else {
        console.error("An unexpected error occurred:", error);
        throw new Error("An unexpected error occurred while updating webhook subscription.");
      }
    }
  }
}

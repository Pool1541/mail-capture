import { WebhookRepository } from "@/webhook/domain/contracts/webhook-repository";
import { RenewWebhook } from "../use-cases/renew-webhook";
import { CreateWebhook } from "../use-cases/create-webhook";
import { DeleteWebhook } from "../use-cases/delete-webhook";

export class WebhookRenewalService {
  constructor(
    private readonly webhookRepository: WebhookRepository,
    private readonly renewWebhook: RenewWebhook,
    private readonly createWebhook: CreateWebhook,
    private readonly deleteWebhook: DeleteWebhook,
  ) {}

  async run() {
    const webhook = await this.webhookRepository.getActiveWebhook();

    if (!webhook) {
      console.log("No existing Webhook found. Creating a new one.");
      await this.createWebhook.execute();
      return;
    }

    const expirationDate = new Date(webhook.expirationDateTime);
    const now = new Date();
    const timeDiff = expirationDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Si faltan 2 días o menos para la expiración, renovar la suscripción
    if (daysLeft <= 2) {
      try {
        console.log(`Renewing webhook ${webhook.id}, days left: ${daysLeft.toString()}`);
        await this.renewWebhook.execute(webhook.id);
        console.log(`Webhook ${webhook.id} renewed successfully.`);
      } catch (error) {
        console.error(`Failed to renew webhook ${webhook.id}:`, error);
        console.log("Creating a new webhook instead.");
        await this.deleteWebhook.execute(webhook.id);
        await this.createWebhook.execute();
      }
    }
  }
}

import { WebhookRepository } from "@/webhook/domain/contracts/webhook-repository";
import { RenewWebhook } from "../use-cases/renew-webhook";
import { CreateWebhook } from "../use-cases/create-webhook";

export class WebhookRenewalService {
  constructor(
    private readonly webhookRepository: WebhookRepository,
    private readonly renewWebhook: RenewWebhook,
    private readonly createWebhook: CreateWebhook,
  ) {}

  async run() {
    const subscription = await this.webhookRepository.getActiveWebhook();

    if (!subscription) {
      console.log("No existing subscription found. Creating a new one.");
      await this.createWebhook.execute();
      return;
    }

    const expirationDate = new Date(subscription.expirationDateTime);
    const now = new Date();
    const timeDiff = expirationDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Si faltan 1 día o menos para la expiración, renovar la suscripción
    if (daysLeft <= 1) {
      try {
        console.log(`Renewing subscription ${subscription.id}, days left: ${daysLeft.toString()}`);
        await this.renewWebhook.execute(subscription.id);
        console.log(`Subscription ${subscription.id} renewed successfully.`);
      } catch (error) {
        console.error(`Failed to renew subscription ${subscription.id}:`, error);
        console.log("Creating a new subscription instead.");
        await this.createWebhook.execute();
      }
    }
  }
}

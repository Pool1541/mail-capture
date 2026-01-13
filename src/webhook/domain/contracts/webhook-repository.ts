import { Webhook } from "../webhook";

export interface WebhookRepository {
  getActiveWebhook(): Promise<Webhook | null>;
  save(webhook: Webhook): Promise<void>;
  update(webhook: Webhook): Promise<void>;
  delete(webhookId: string): Promise<void>;
}

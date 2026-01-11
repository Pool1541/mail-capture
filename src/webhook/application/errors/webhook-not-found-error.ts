import { NotFoundError } from "@/shared/domain/errors/common-errors";

export class WebhookNotFoundError extends NotFoundError {
  constructor(webhookId?: string) {
    super("Webhook", "Webhook", webhookId);
  }
}

import { ValidationError } from "@/shared/domain/errors/common-errors";

export class WebhookError extends ValidationError {
  constructor(field: string, message?: string) {
    super("WEBHOOK", field, message ?? "Invalid Webhook");
  }
}

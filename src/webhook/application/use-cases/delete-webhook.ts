import { type IEmailClientService } from "@/result/domain/contracts/email-client-service";
import { WebhookRepository } from "@/webhook/domain/contracts/webhook-repository";

export class DeleteWebhook {
  private readonly endpoint = "https://graph.microsoft.com/v1.0/subscriptions";
  constructor(
    private readonly emailClientService: IEmailClientService,
    private readonly webhookRepository: WebhookRepository,
  ) {}

  async execute(subscriptionId: string) {
    const accessToken = await this.emailClientService.getAccessToken();

    const requestInit: RequestInit = {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    };

    try {
      const response = await fetch(`${this.endpoint}/${subscriptionId}`, requestInit);

      if (!response.ok) {
        const errorData = (await response.json()) as unknown;
        console.log("MS webhook delete error:", errorData);
        throw new Error(`Error deleting webhook subscription: ${response.status.toString()} - ${response.statusText}`);
      }

      await this.webhookRepository.delete(subscriptionId);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error deleting webhook subscription, creating a new one instead:", error.message);
        throw error;
      } else {
        console.error("An unexpected error occurred:", error);
        throw new Error("An unexpected error occurred while deleting webhook subscription.");
      }
    }
  }
}

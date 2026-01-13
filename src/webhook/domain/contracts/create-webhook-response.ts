export interface CreateWebhookResponse {
  id: string;
  resource: string;
  changeType: string;
  notificationUrl: string;
  expirationDateTime: string;
}

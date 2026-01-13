export interface UpdateWebhookResponse {
  id: string;
  resource: string;
  changeType: string;
  notificationUrl: string;
  expirationDateTime: string;
}

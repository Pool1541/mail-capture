import { WebhookEmailClient } from "./value-objects/email-client";

export class Webhook {
  id: string;
  client: WebhookEmailClient;
  resource: string;
  changeType: string;
  active: boolean;
  notificationUrl: string;
  createdAt: Date;
  expirationDateTime: Date;

  constructor({
    id,
    client,
    resource,
    changeType,
    active,
    notificationUrl,
    expirationDateTime,
    createdAt,
  }: {
    id: string;
    client: WebhookEmailClient;
    resource: string;
    changeType: string;
    active: boolean;
    notificationUrl: string;
    expirationDateTime: Date;
    createdAt: Date;
  }) {
    this.id = id;
    this.client = client;
    this.resource = resource;
    this.changeType = changeType;
    this.active = active;
    this.notificationUrl = notificationUrl;
    this.expirationDateTime = expirationDateTime;
    this.createdAt = createdAt;
  }
}

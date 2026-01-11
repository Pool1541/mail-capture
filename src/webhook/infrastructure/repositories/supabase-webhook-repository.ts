import { SupabaseClient } from "@supabase/supabase-js";

import { type Database } from "@/shared/infrastructure/types/supabase";
import { type SupabaseWebhookEntity } from "@/shared/infrastructure/types/database-entities";

import { Webhook } from "@/webhook/domain/webhook";
import { WebhookRepository } from "@/webhook/domain/contracts/webhook-repository";
import { WebhookEmailClient } from "@/webhook/domain/value-objects/email-client";
import { RepositoryError } from "@/shared/domain/errors";

export class SupabaseWebhookRepository implements WebhookRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getActiveWebhook(): Promise<Webhook | null> {
    const { data, error } = await this.supabase.from("webhooks").select("*").eq("active", true).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch active webhook: ${error.message}`);
    }

    return data ? this.mapToDomain(data) : null;
  }

  async save(webhook: Webhook): Promise<void> {
    const { error } = await this.supabase.from("webhooks").insert({
      id: webhook.id,
      client: webhook.client.getValue(),
      resource: webhook.resource,
      change_type: webhook.changeType,
      active: webhook.active,
      notification_url: webhook.notificationUrl,
      created_at: webhook.createdAt.toISOString(),
      expiration_time: webhook.expirationDateTime.toISOString(),
    });

    if (error) {
      throw new Error(`Failed to save webhook: ${error.message}`);
    }
  }

  async update(webhook: Webhook): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("webhooks")
        .update({
          change_type: webhook.changeType,
          active: webhook.active,
          expiration_time: webhook.expirationDateTime.toISOString(),
        })
        .eq("id", webhook.id);

      if (error) {
        throw new RepositoryError("WEBHOOK", `Failed to update webhook: ${error.message}`, error);
      }
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError("WEBHOOK", "Unexpected error updating webhook", error);
    }
  }

  async delete(webhookId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("webhooks")
        .update({
          active: false,
          change_type: "deleted",
        })
        .eq("id", webhookId);

      if (error) {
        throw new RepositoryError("WEBHOOK", `Failed to delete webhook: ${error.message}`, error);
      }
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError("WEBHOOK", "Unexpected error deleting webhook", error);
    }
  }

  private mapToDomain(data: SupabaseWebhookEntity): Webhook {
    return new Webhook({
      id: data.id,
      client: new WebhookEmailClient(data.client),
      notificationUrl: data.notification_url,
      createdAt: new Date(data.created_at),
      expirationDateTime: new Date(data.expiration_time),
      resource: data.resource,
      changeType: data.change_type,
      active: data.active,
    });
  }
}

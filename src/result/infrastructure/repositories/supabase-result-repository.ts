import { SupabaseClient } from "@supabase/supabase-js";

import { type Database } from "@/shared/infrastructure/types/supabase";
import { type ResultRepository } from "../../domain/contracts/result-repository";
import { type SupabaseResultEntity } from "@/shared/infrastructure/types/database-entities";

import { Result } from "../../domain/result";
import { UserId } from "../../domain/value-objects/user-id";
import { ResultId } from "../../domain/value-objects/result-id";
import { ResultOpened } from "../../domain/value-objects/result-opened";
import { ResultCreatedAt } from "../../domain/value-objects/created-at";
import { RepositoryError } from "@/shared/domain/errors/common-errors";
import { EmailClient } from "@/result/domain/value-objects/email-client";

export class SupabaseResultRepository implements ResultRepository {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  async listAll(): Promise<Result[]> {
    try {
      const { data, error } = await this.supabase.from("results").select("*");

      if (error) {
        throw new RepositoryError("RESULT", `Failed to list results: ${error.message}`, error);
      }

      return data.map((item) => this.mapToDomain(item));
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError("RESULT", "Unexpected error listing results", error);
    }
  }

  async findByMessageId(messageId: string): Promise<Result | null> {
    try {
      const { data, error } = await this.supabase.from("results").select("*").eq("message_id", messageId).single();

      if (error) {
        // Error de "no encontrado" es esperado, no es un error de repositorio
        if (error.code === "PGRST116") return null;
        throw new RepositoryError("RESULT", `Failed to find result by message ID: ${error.message}`, error);
      }

      return this.mapToDomain(data);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError("RESULT", "Unexpected error finding result by message ID", error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase.from("results").delete().eq("id", id);

      if (error) {
        throw new RepositoryError("RESULT", `Failed to delete result: ${error.message}`, error);
      }
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError("RESULT", "Unexpected error deleting result", error);
    }
  }

  async update(result: Result): Promise<void> {
    try {
      const id = result.getId()?.getValue();

      if (!id) {
        throw new RepositoryError("RESULT", "Result ID is required for update");
      }

      const { error } = await this.supabase
        .from("results")
        .update({
          opened: result.getOpened().getValue(),
          result_url: result.getResultUrl(),
        })
        .eq("id", id);

      if (error) {
        throw new RepositoryError("RESULT", `Failed to update result: ${error.message}`, error);
      }
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError("RESULT", "Unexpected error updating result", error);
    }
  }

  async save(result: Result): Promise<void> {
    try {
      const { error } = await this.supabase.from("results").insert([
        {
          opened: result.getOpened().getValue(),
          email_client: result.getEmailClient().getValue(),
          uid: result.getUserId().getValue(),
          message_id: result.getMessageId(),
        },
      ]);

      if (error) {
        throw new RepositoryError("RESULT", `Failed to save result: ${error.message}`, error);
      }
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError("RESULT", "Unexpected error saving result", error);
    }
  }

  async findById(id: string): Promise<Result | null> {
    try {
      const { data, error } = await this.supabase.from("results").select("*").eq("id", id).single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw new RepositoryError("RESULT", `Failed to find result by ID: ${error.message}`, error);
      }

      return this.mapToDomain(data);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError("RESULT", "Unexpected error finding result by ID", error);
    }
  }

  private mapToDomain(data: SupabaseResultEntity): Result {
    return new Result({
      id: new ResultId(data.id),
      createdAt: new ResultCreatedAt(new Date(data.created_at)),
      emailClient: new EmailClient(data.email_client),
      messageId: data.message_id,
      openend: new ResultOpened(data.opened),
      resultUrl: data.result_url ?? undefined,
      userId: new UserId(data.uid),
    });
  }
}

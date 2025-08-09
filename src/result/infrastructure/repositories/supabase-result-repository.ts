import { SupabaseClient } from "@supabase/supabase-js";

import { type Database } from "@/shared/infrastructure/types/supabase";
import { type ResultRepository } from "../../domain/contracts/result-repository";
import { type SupabaseResultEntity } from "@/shared/infrastructure/types/database-entities";

import { Result } from "../../domain/result";
import { UserId } from "../../domain/value-objects/user-id";
import { ResultId } from "../../domain/value-objects/result-id";
import { ResultOpened } from "../../domain/value-objects/result-opened";
import { ResultCreatedAt } from "../../domain/value-objects/created-at";

export class SupabaseResultRepository implements ResultRepository {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  async listAll(): Promise<Result[]> {
    const { data, error } = await this.supabase.from("results").select("*");

    if (error) {
      console.log(error);
      throw error;
    }

    return data.map((item) => this.mapToDomain(item));
  }

  async findByMessageId(messageId: string): Promise<Result | null> {
    const { data, error } = await this.supabase.from("results").select("*").eq("message_id", messageId).single();

    if (error) {
      console.log(error);
      return null;
    }

    return this.mapToDomain(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("results").delete().eq("id", id);

    if (error) throw error;
  }

  async update(result: Result): Promise<void> {
    const id = result.getId()?.getValue();

    if (!id) {
      throw new Error("Result ID is required for update");
    }

    const { error } = await this.supabase
      .from("results")
      .update({
        opened: result.getOpened().getValue(),
        result_url: result.getResultUrl(),
      })
      .eq("id", id);

    if (error) throw error;
  }

  async save(result: Result): Promise<void> {
    const { error } = await this.supabase.from("results").insert([
      {
        opened: result.getOpened().getValue(),
        email_client: result.getEmailClient(),
        uid: result.getUserId().getValue(),
        message_id: result.getMessageId(),
      },
    ]);

    if (error) throw error;
  }

  async findById(id: string): Promise<Result | null> {
    const { data, error } = await this.supabase.from("results").select("*").eq("id", id).single();

    if (error) {
      console.log(error);
      return null;
    }

    return this.mapToDomain(data);
  }

  private mapToDomain(data: SupabaseResultEntity): Result {
    return new Result({
      id: new ResultId(data.id),
      createdAt: new ResultCreatedAt(new Date(data.created_at)),
      emailClient: data.email_client,
      messageId: data.message_id,
      openend: new ResultOpened(data.opened),
      resultUrl: data.result_url ?? undefined,
      userId: new UserId(data.uid),
    });
  }
}

import { SupabaseClient } from "@supabase/supabase-js";

import { type Database } from "@/shared/infrastructure/types/supabase";
import { type UserRepository } from "@/user/domain/contracts/user-repository";
import { type SupabaseUserEntity } from "@/shared/infrastructure/types/database-entities";

import { User } from "@/user/domain/user";
import { UserId } from "@/user/domain/value-objects/user-id";
import { UserName } from "@/user/domain/value-objects/user-name";
import { UserEmail } from "@/user/domain/value-objects/user-email";
import { UserAvatar } from "@/user/domain/value-objects/user-avatar";
import { UserCreatedAt } from "@/user/domain/value-objects/user-created-at";
import { UserUpdatedAt } from "@/user/domain/value-objects/user-updated-at";

export class SupabaseUserRepository implements UserRepository {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }
  async listAll(): Promise<User[]> {
    const { data, error } = await this.supabase.from("users").select("*");

    if (error) throw new Error(error.message);

    return data.map((item) => this.mapToDomain(item));
  }

  async findById(id: string): Promise<User | null> {
    if (!id) return null;
    const { data, error } = await this.supabase.from("users").select("*").eq("id", id).single();

    if (error) return null;

    return this.mapToDomain(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) return null;

    const { data, error } = await this.supabase.from("users").select("*").eq("email", email).single();

    if (error) {
      console.log(error);
      return null;
    }

    return this.mapToDomain(data);
  }

  async save(user: User): Promise<void> {
    const { error } = await this.supabase.from("users").insert([
      {
        name: user.getName()?.getValue(),
        email: user.getEmail().getValue(),
        avatar_url: user.getAvatar()?.getValue(),
      },
    ]);

    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("users").delete().eq("id", id);

    if (error) throw error;
  }

  async existsByEmail(email: string): Promise<boolean> {
    if (!email) return false;
    const { data, error } = await this.supabase.from("users").select("id").eq("email", email).maybeSingle();

    if (error) {
      console.log(error);
      throw error;
    }

    return !!data;
  }

  async update(user: User): Promise<void> {
    const { error } = await this.supabase
      .from("users")
      .update({
        name: user.getName()?.getValue(),
        email: user.getEmail().getValue(),
        avatar: user.getAvatar()?.getValue(),
        updated_at: user.getUpdatedAt().toISOString(),
      })
      .eq("id", user.requireId().getValue());

    if (error) throw error;
  }

  private mapToDomain(data: SupabaseUserEntity): User {
    return new User({
      id: new UserId(data.id),
      ...(data.name ? { name: new UserName(data.name) } : {}),
      ...(data.avatar_url ? { avatar: new UserAvatar(data.avatar_url) } : {}),
      email: new UserEmail(data.email),
      createdAt: new UserCreatedAt(data.created_at),
      updatedAt: new UserUpdatedAt(data.updated_at),
    });
  }
}

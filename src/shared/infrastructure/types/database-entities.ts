import type { Constants, Tables } from "./supabase";

export type SupabaseResultEntity = Tables<"results">;
export type SupabaseUserEntity = Tables<"users">;
export type SupabaseEmailClients = (typeof Constants.public.Enums.email_clients)[number];

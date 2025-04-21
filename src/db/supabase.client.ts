import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

// Use PUBLIC_ env vars if present, otherwise fallback to server-only vars
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ??
    import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY ??
    import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
);

// Export SupabaseClient type for use in the application
export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "default-user-id";

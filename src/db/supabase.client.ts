import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Default user ID for development purposes
export const DEFAULT_USER_ID = "3c0f4c21-24cf-4ef5-bae1-8de7e622eeda";

export const supabaseClient = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
);

// Export SupabaseClient type for use in the application
export type SupabaseClient = typeof supabaseClient;

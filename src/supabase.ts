import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env / .env.local
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

// Check if credentials are valid and not the default template placeholders
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseUrl !== "YOUR_SUPABASE_PROJECT_URL" && 
  supabaseServiceRoleKey && 
  supabaseServiceRoleKey !== "YOUR_SUPABASE_SERVICE_ROLE_KEY"
);

if (!isSupabaseConfigured) {
  console.warn(
    "[Supabase Warning] Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file."
  );
}

// Instantiate with placeholders if not configured to prevent startup crashes
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co",
  isSupabaseConfigured ? supabaseServiceRoleKey : "placeholder-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

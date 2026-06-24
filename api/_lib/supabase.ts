import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const isConfigured = !!(
  supabaseUrl &&
  supabaseUrl !== "YOUR_SUPABASE_PROJECT_URL" &&
  supabaseKey &&
  supabaseKey !== "YOUR_SUPABASE_SERVICE_ROLE_KEY"
);

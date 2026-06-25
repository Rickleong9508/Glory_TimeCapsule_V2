import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "").trim();

export const isConfigured = !!(
  supabaseUrl &&
  supabaseUrl !== "YOUR_SUPABASE_PROJECT_URL" &&
  supabaseKey &&
  supabaseKey !== "YOUR_SUPABASE_SERVICE_ROLE_KEY"
);

let client: any;

try {
  let cleanUrl = supabaseUrl;
  if (isConfigured && cleanUrl) {
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }
  }

  client = createClient(
    isConfigured ? cleanUrl : "https://placeholder.supabase.co",
    isConfigured ? supabaseKey : "placeholder-key",
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
} catch (e) {
  console.error("Supabase client initialization crashed:", e);
  client = createClient("https://placeholder.supabase.co", "placeholder-key", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const supabase = client;



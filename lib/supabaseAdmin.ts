import { createClient } from "@supabase/supabase-js";

// Server-only client. SUPABASE_SERVICE_ROLE_KEY must NOT be a NEXT_PUBLIC_ variable.
// Only import this from files in pages/api/.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
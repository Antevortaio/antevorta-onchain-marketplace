import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,     // ok: public
  process.env.SUPABASE_SERVICE_ROLE          // ATTENTION: server only
);

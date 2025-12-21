// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anon) {
  console.warn("Missing NEXT_PUBLIC_SUPABASE_* env variables for Supabase client");
}

export const supabase = createClient(url, anon, {
  realtime: { params: { eventsPerSecond: 15 } },
});

// Server helper: create server-side client (service role) when used in route handlers
export const createServerSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Server Supabase keys are required");
  return createClient(url, key);
};
export default supabase;

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Anon-key client for storefront reads. It never touches cookies, so pages
 * that use it can be statically rendered and cached (ISR) instead of
 * re-rendering on every request.
 */
export function createPublicClient() {
  client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  return client;
}

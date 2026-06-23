// =============================================================================
// QA Copilot — Supabase Server Client
// =============================================================================
// This module creates a privileged Supabase client that uses the service role
// key. It should ONLY be used in server-side contexts (server components,
// server actions, route handlers). Never import this from client components.
// =============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Whether we are running in demo mode (no real Supabase credentials).
 * When true, callers should fall back to mock data instead of making
 * real Supabase calls.
 */
export const isDemoMode: boolean =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "your_supabase_project_url" ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY === "your_supabase_service_role_key";

/** Cached server client instance (singleton). */
let _client: SupabaseClient | null = null;

/**
 * Returns a server-side Supabase client configured with the service role key.
 *
 * The client is lazily created and cached for the lifetime of the process.
 * In demo mode this function will still return a client, but all requests
 * will fail — callers should check `isDemoMode` first.
 *
 * @throws {Error} If env vars are missing and we are NOT in demo mode.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!isDemoMode && (!supabaseUrl || !serviceRoleKey)) {
    throw new Error(
      "[supabase-server] Missing environment variables: " +
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
    );
  }

  _client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // The service role key bypasses RLS — we handle auth at the
      // application layer instead.
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _client;
}

/**
 * Convenience re-export so server actions can do:
 *   import { supabaseServer } from "@/lib/supabase-server";
 *
 * This is a lazy getter that only initialises the client on first access.
 */
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseServerClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

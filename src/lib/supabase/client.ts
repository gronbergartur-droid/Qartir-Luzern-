import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Lazily-created Supabase client. Only instantiated when both env vars are
 * present so the app can run fully offline against the mock data provider
 * during development of new modules before a project is provisioned.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

let sessionReady: Promise<void> | null = null;

/**
 * The RLS policies in supabase/migrations/0001_init.sql grant access to the
 * `authenticated` role, not `anon` - a public anon/publishable key alone
 * would otherwise let anyone read/write hospital data. Since this app has
 * no real login yet (see lib/currentUser.ts), it signs in anonymously to
 * obtain an `authenticated` session; real Supabase Auth (email/SSO) is a
 * separate future step once user/role management is introduced.
 *
 * Requires "Anonymous Sign-Ins" enabled in the Supabase project
 * (Authentication -> Sign In / Providers -> Anonymous).
 */
export function ensureSupabaseSession(): Promise<void> {
  if (!supabase) return Promise.resolve();
  if (!sessionReady) {
    sessionReady = supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) return;
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.warn(
          'Anonyme Supabase-Anmeldung fehlgeschlagen - ist "Anonymous Sign-Ins" im Supabase-Projekt aktiviert?',
          error,
        );
      }
    });
  }
  return sessionReady;
}

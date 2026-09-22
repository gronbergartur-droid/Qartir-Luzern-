import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Lazily-created Supabase client. Only instantiated when both env vars are
 * present so the app can run fully offline against the mock data provider
 * during development of new modules before a project is provisioned.
 *
 * Authentication is real Supabase Auth (email/password) - see
 * src/lib/auth/AuthContext.tsx. There is deliberately no anonymous
 * sign-in bootstrap: this is a clinical application, and RLS
 * (supabase/migrations/0002_auth_roles.sql) requires a real, active,
 * role-assigned account for every read and write of hospital data.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

import { useCurrentUser } from '@/lib/currentUser';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { dataProvider } from '@/services';
import type { UserProfile } from '@/types/database';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type AuthStatus = 'loading' | 'signed-out' | 'pending' | 'active' | 'error';

interface AuthContextValue {
  /** In local/mock mode this is always 'active' - no login is required (see services/localProvider.ts). */
  status: AuthStatus;
  profile: UserProfile | null;
  /** Tamper-evident identity to record as `performedBy` on every scan/case/CRUD action. */
  performedBy: string;
  error: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured) {
    return <LocalAuthProvider>{children}</LocalAuthProvider>;
  }
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}

/** No real auth in local/mock mode - keeps the existing device-identity flow working unchanged. */
function LocalAuthProvider({ children }: { children: ReactNode }) {
  const { name } = useCurrentUser();

  const value: AuthContextValue = {
    status: 'active',
    profile: null,
    performedBy: name,
    error: null,
    signIn: async () => null,
    signUp: async () => null,
    signOut: async () => {},
    refreshProfile: async () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    try {
      const p = await dataProvider.getCurrentProfile();
      setProfile(p);
      setStatus(p?.active ? 'active' : 'pending');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profil konnte nicht geladen werden.');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        loadProfile();
      } else {
        setStatus('signed-out');
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session) {
        loadProfile();
      } else {
        setProfile(null);
        setStatus('signed-out');
      }
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    if (!supabase) return 'Supabase ist nicht konfiguriert.';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? translateAuthError(error.message) : null;
  };

  const signUp: AuthContextValue['signUp'] = async (email, password, displayName) => {
    if (!supabase) return 'Supabase ist nicht konfiguriert.';
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        // Send the confirmation link back to wherever this app is actually
        // running (must also be added to Authentication -> URL
        // Configuration -> Redirect URLs in the Supabase dashboard).
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    });
    return error ? translateAuthError(error.message) : null;
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const value: AuthContextValue = {
    status,
    profile,
    performedBy: profile?.displayName ?? '',
    error,
    signIn,
    signUp,
    signOut,
    refreshProfile: loadProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden.');
  return ctx;
}

function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'E-Mail oder Passwort ist falsch.';
  if (/user already registered/i.test(message)) return 'Für diese E-Mail existiert bereits ein Konto.';
  if (/password should be at least/i.test(message)) return 'Passwort ist zu kurz (mindestens 6 Zeichen).';
  if (/email not confirmed/i.test(message)) return 'E-Mail-Adresse ist noch nicht bestätigt.';
  return message;
}

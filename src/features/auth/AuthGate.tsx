import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { Clock, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { LoginPage } from './LoginPage';

/**
 * Gatekeeper rendered around the whole app. In local/mock mode this is a
 * no-op (status is always 'active' - see AuthContext.tsx). Against a real
 * Supabase project it enforces: no session -> login screen, a session
 * without an active profile -> pending-activation screen, only an active
 * profile reaches the app itself.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status, error, signOut, refreshProfile } = useAuth();

  if (!isSupabaseConfigured) return <>{children}</>;

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (status === 'signed-out') {
    return <LoginPage />;
  }

  if (status === 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
        <Card className="w-full max-w-sm p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-50 text-warning-600">
            <Clock size={24} />
          </div>
          <h1 className="text-base font-semibold text-ink-900">Konto wartet auf Freigabe</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Ihr Konto wurde erstellt, ist aber noch nicht aktiviert. Bitte wenden Sie sich an eine
            Administratorin oder einen Administrator, um Zugriff auf IDM Mobile zu erhalten.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" size="md" fullWidth onClick={() => refreshProfile()}>
              Erneut prüfen
            </Button>
            <Button variant="ghost" size="md" fullWidth onClick={() => signOut()}>
              Abmelden
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
        <Card className="w-full max-w-sm p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-50 text-danger-600">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-base font-semibold text-ink-900">Anmeldung fehlgeschlagen</h1>
          <p className="mt-1.5 text-sm text-ink-500">{error}</p>
          <Button className="mt-4" variant="secondary" size="md" fullWidth onClick={() => signOut()}>
            Abmelden
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

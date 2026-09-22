import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth/AuthContext';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

/**
 * Real Supabase Auth login/registration screen, shown whenever the app is
 * connected to a real Supabase project and no active session exists. There
 * is no anonymous or public write access - every account must be created
 * here (or by an admin) and then activated by an admin before it can read
 * or write hospital data (see Benutzerverwaltung / supabase/migrations/0002_auth_roles.sql).
 */
export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const err = await signIn(email.trim(), password);
        if (err) setError(err);
      } else {
        const err = await signUp(email.trim(), password, displayName.trim());
        if (err) {
          setError(err);
        } else {
          setInfo('Konto erstellt. Ein Admin muss es freischalten, bevor Sie sich anmelden können.');
          setMode('login');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-lg font-semibold text-ink-900">IDM Mobile</h1>
          <p className="text-sm text-ink-500">LEIH-SIEB SCANNER - Anmeldung erforderlich</p>
        </div>

        <Card className="p-4">
          <div className="mb-4 flex rounded-xl bg-ink-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setInfo(null);
              }}
              className={[
                'flex-1 rounded-lg py-2 transition-colors',
                mode === 'login' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500',
              ].join(' ')}
            >
              Anmelden
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setInfo(null);
              }}
              className={[
                'flex-1 rounded-lg py-2 transition-colors',
                mode === 'register' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500',
              ].join(' ')}
            >
              Konto erstellen
            </button>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Name
                </span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  placeholder="Vor- und Nachname"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
                E-Mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="name@spital.ch"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
                Passwort
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="••••••••"
              />
            </label>

            {error && <p className="rounded-xl bg-danger-50 p-3 text-sm text-danger-600">{error}</p>}
            {info && <p className="rounded-xl bg-success-50 p-3 text-sm text-success-700">{info}</p>}

            <Button type="submit" size="lg" fullWidth disabled={submitting}>
              {submitting
                ? 'Wird verarbeitet …'
                : mode === 'login'
                  ? 'Anmelden'
                  : 'Konto erstellen'}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-xs text-ink-400">
          Keine öffentlichen Schreibrechte - jedes Konto muss von einem Admin freigeschaltet werden.
        </p>
      </div>
    </div>
  );
}

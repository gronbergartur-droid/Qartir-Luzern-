import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth/AuthContext';
import { dataProvider } from '@/services';
import { USER_ROLE_LABELS, type Supplier, type UserProfile, type UserRole } from '@/types/database';
import { useEffect, useState } from 'react';

/**
 * Admin-only Benutzerverwaltung: activate new accounts and assign roles.
 * RLS (0002_auth_roles.sql) enforces admin-only writes server-side too - a
 * non-admin who somehow lands here simply gets a permission error on save.
 */
export function UserManagementPage() {
  const { profile: me } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [allProfiles, allSuppliers] = await Promise.all([
        dataProvider.listProfiles(),
        dataProvider.getSuppliers(),
      ]);
      setProfiles(allProfiles);
      setSuppliers(allSuppliers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benutzer konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (id: string, patch: Partial<Pick<UserProfile, 'role' | 'active' | 'supplierId'>>) => {
    setSavingId(id);
    setError(null);
    try {
      const updated = await dataProvider.updateProfile(id, patch);
      setProfiles((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSavingId(null);
    }
  };

  if (me && me.role !== 'admin') {
    return (
      <div>
        <TopBar title="Benutzerverwaltung" showBack />
        <p className="px-4 py-10 text-center text-sm text-ink-400">
          Nur Admins können Benutzer verwalten.
        </p>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Benutzerverwaltung" subtitle={`${profiles.length} Konten`} showBack />
      <div className="px-4 py-4">
        {error && <p className="mb-3 rounded-xl bg-danger-50 p-3 text-sm text-danger-600">{error}</p>}
        {loading && <p className="text-center text-sm text-ink-400">Wird geladen …</p>}

        <div className="space-y-2">
          {profiles.map((p) => (
            <Card key={p.id} className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{p.displayName}</p>
                  <p className="truncate text-xs text-ink-500">{p.email}</p>
                </div>
                <Badge tone={p.active ? 'success' : 'warning'}>{p.active ? 'Aktiv' : 'Wartet auf Freigabe'}</Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                    Rolle
                  </span>
                  <select
                    value={p.role}
                    disabled={savingId === p.id}
                    onChange={(e) => save(p.id, { role: e.target.value as UserRole })}
                    className="w-full rounded-lg border border-ink-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-brand-500"
                  >
                    {(Object.keys(USER_ROLE_LABELS) as UserRole[]).map((role) => (
                      <option key={role} value={role}>
                        {USER_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                    Lieferant
                  </span>
                  <select
                    value={p.supplierId ?? ''}
                    disabled={savingId === p.id || p.role !== 'lieferant'}
                    onChange={(e) => save(p.id, { supplierId: e.target.value || null })}
                    className="w-full rounded-lg border border-ink-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-brand-500 disabled:bg-ink-50 disabled:text-ink-300"
                  >
                    <option value="">Keiner</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="button"
                disabled={savingId === p.id || p.id === me?.id}
                onClick={() => save(p.id, { active: !p.active })}
                className={[
                  'mt-3 w-full rounded-lg py-2 text-xs font-semibold transition-colors',
                  p.active
                    ? 'bg-danger-50 text-danger-600 active:bg-danger-100'
                    : 'bg-success-50 text-success-700 active:bg-success-100',
                  p.id === me?.id ? 'opacity-40' : '',
                ].join(' ')}
              >
                {p.active ? 'Deaktivieren' : 'Freischalten'}
              </button>
            </Card>
          ))}
          {!loading && profiles.length === 0 && (
            <p className="text-center text-sm text-ink-400">Keine Benutzerkonten gefunden.</p>
          )}
        </div>
      </div>
    </div>
  );
}

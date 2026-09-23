import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { dataProvider } from '@/services';
import type { Physician } from '@/types/database';
import { Mail, Phone, Plus, Search, Stethoscope } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

export function PhysiciansPage() {
  const [physicians, setPhysicians] = useState<Physician[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    dataProvider.getPhysicians().then(setPhysicians);
  }, []);

  const filtered = useMemo(() => {
    if (!physicians) return [];
    const q = query.trim().toLowerCase();
    if (!q) return physicians;
    return physicians.filter((p) => [p.name, p.department].some((field) => field.toLowerCase().includes(q)));
  }, [physicians, query]);

  const byDepartment = useMemo(() => {
    const groups = new Map<string, Physician[]>();
    for (const p of filtered) {
      const list = groups.get(p.department) ?? [];
      list.push(p);
      groups.set(p.department, list);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div>
      <TopBar
        title="Ärzteliste"
        subtitle="Belegärzte/Operateure"
        right={
          <Link
            to="/aerzte/neu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 active:bg-brand-100"
            aria-label="Neuer Arzt"
          >
            <Plus size={18} />
          </Link>
        }
      />

      <div className="px-4 pt-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suche nach Name, Fachbereich …"
            className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="px-4 py-4">
        {physicians === null && <p className="py-10 text-center text-sm text-ink-400">Wird geladen …</p>}

        {physicians !== null && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
              <Stethoscope size={26} />
            </div>
            <p className="text-sm font-medium text-ink-700">Keine Treffer</p>
          </div>
        )}

        {byDepartment.map(([department, list]) => (
          <div key={department} className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">{department}</p>
            <div className="space-y-2.5">
              {list.map((physician) => (
                <PhysicianCard key={physician.id} physician={physician} />
              ))}
            </div>
          </div>
        ))}

        {physicians !== null && (
          <p className="mt-2 text-center text-xs text-ink-400">
            {filtered.length} von {physicians.length} Ärzt:innen
          </p>
        )}
      </div>
    </div>
  );
}

function PhysicianCard({ physician }: { physician: Physician }) {
  return (
    <Card className="p-3.5">
      <p className="text-sm font-semibold text-ink-900">{physician.name}</p>
      {(physician.mobilePhone || physician.practicePhone || physician.email) && (
        <div className="mt-2 space-y-1 text-xs text-ink-600">
          {physician.mobilePhone && (
            <span className="flex items-center gap-1.5">
              <Phone size={12} className="shrink-0 text-ink-400" />
              {physician.mobilePhone}
            </span>
          )}
          {physician.practicePhone && (
            <span className="flex items-center gap-1.5">
              <Phone size={12} className="shrink-0 text-ink-400" />
              Praxis: {physician.practicePhone}
            </span>
          )}
          {physician.email && (
            <span className="flex items-center gap-1.5">
              <Mail size={12} className="shrink-0 text-ink-400" />
              {physician.email}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

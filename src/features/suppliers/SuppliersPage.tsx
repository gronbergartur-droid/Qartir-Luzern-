import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { dataProvider } from '@/services';
import type { Supplier } from '@/types/database';
import { BadgeCheck, Mail, MapPin, Phone, Search, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    dataProvider.getSuppliers().then(setSuppliers);
  }, []);

  const filtered = useMemo(() => {
    if (!suppliers) return [];
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) =>
      [s.name, s.location ?? '', ...s.specialties].some((field) => field.toLowerCase().includes(q)),
    );
  }, [suppliers, query]);

  return (
    <div>
      <TopBar title="Lieferantenverwaltung" subtitle="Bestätigte Leihservice-Anbieter (Schweiz)" />

      <div className="px-4 pt-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suche nach Lieferant, Standort, Fachgebiet …"
            className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="px-4 py-4">
        {suppliers === null && <p className="py-10 text-center text-sm text-ink-400">Wird geladen …</p>}

        {suppliers !== null && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
              <Truck size={26} />
            </div>
            <p className="text-sm font-medium text-ink-700">Keine Treffer</p>
            <p className="max-w-[220px] text-xs text-ink-500">
              Kein Lieferant entspricht der Suche „{query}“.
            </p>
          </div>
        )}

        <div className="space-y-2.5">
          {filtered.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))}
        </div>

        {suppliers !== null && (
          <p className="mt-4 text-center text-xs text-ink-400">
            {filtered.length} von {suppliers.length} Lieferanten
          </p>
        )}
      </div>
    </div>
  );
}

function SupplierCard({ supplier }: { supplier: Supplier }) {
  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{supplier.name}</p>
          {supplier.location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
              <MapPin size={12} className="shrink-0" />
              {supplier.location}
            </p>
          )}
        </div>
        {supplier.loanServiceConfirmed && (
          <span className="shrink-0">
            <Badge tone="success">
              <BadgeCheck size={12} />
              Leihservice
            </Badge>
          </span>
        )}
      </div>

      {supplier.loanServiceNote && (
        <p className="mt-2 text-xs text-ink-600">{supplier.loanServiceNote}</p>
      )}

      {supplier.specialties.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {supplier.specialties.map((specialty) => (
            <span
              key={specialty}
              className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700"
            >
              {specialty}
            </span>
          ))}
        </div>
      )}

      {(supplier.contactPhone || supplier.contactEmail || supplier.contactNote) && (
        <div className="mt-3 space-y-1 border-t border-ink-100 pt-2.5 text-xs text-ink-600">
          {supplier.contactPhone && (
            <a href={`tel:${supplier.contactPhone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5">
              <Phone size={12} className="shrink-0 text-ink-400" />
              {supplier.contactPhone}
            </a>
          )}
          {supplier.contactEmail && (
            <a href={`mailto:${supplier.contactEmail}`} className="flex items-center gap-1.5">
              <Mail size={12} className="shrink-0 text-ink-400" />
              {supplier.contactEmail}
            </a>
          )}
          {supplier.contactNote && (
            <p className="flex items-start gap-1.5 text-ink-500">
              <MapPin size={12} className="mt-0.5 shrink-0 text-ink-400" />
              {supplier.contactNote}
            </p>
          )}
        </div>
      )}

      {supplier.source && <p className="mt-2 text-[11px] text-ink-400">Quelle: {supplier.source}</p>}
    </Card>
  );
}

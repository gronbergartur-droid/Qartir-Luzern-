import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Supplier, Tray, TrayInput, TrayInstrument } from '@/types/database';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface TrayFormProps {
  suppliers: Supplier[];
  initialTray?: Tray;
  initialInstruments?: TrayInstrument[];
  initialSupplierId?: string;
  onSubmit: (input: TrayInput) => Promise<void>;
  submitLabel: string;
}

interface InstrumentRow {
  key: string;
  name: string;
  quantity: number;
  critical: boolean;
}

function toInstrumentRows(instruments?: TrayInstrument[]): InstrumentRow[] {
  if (!instruments || instruments.length === 0) {
    return [{ key: crypto.randomUUID(), name: '', quantity: 1, critical: false }];
  }
  return instruments
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((i) => ({ key: i.id, name: i.name, quantity: i.quantity, critical: i.critical }));
}

export function TrayForm({
  suppliers,
  initialTray,
  initialInstruments,
  initialSupplierId,
  onSubmit,
  submitLabel,
}: TrayFormProps) {
  const [code, setCode] = useState(initialTray?.code ?? '');
  const [aliases, setAliases] = useState(initialTray?.aliases.join(', ') ?? '');
  const [name, setName] = useState(initialTray?.name ?? '');
  const [supplierId, setSupplierId] = useState(initialTray?.supplierId ?? initialSupplierId ?? suppliers[0]?.id ?? '');
  const [instruments, setInstruments] = useState<InstrumentRow[]>(toInstrumentRows(initialInstruments));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validInstruments = instruments.filter((i) => i.name.trim().length > 0);
  const expectedCount = validInstruments.reduce((sum, i) => sum + i.quantity, 0);
  const canSubmit = code.trim().length > 0 && name.trim().length > 0 && supplierId && validInstruments.length > 0;

  const updateInstrument = (key: string, patch: Partial<InstrumentRow>) => {
    setInstruments((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const removeInstrument = (key: string) => {
    setInstruments((rows) => rows.filter((r) => r.key !== key));
  };

  const addInstrument = () => {
    setInstruments((rows) => [...rows, { key: crypto.randomUUID(), name: '', quantity: 1, critical: false }]);
  };

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    setError(null);
    setSaving(true);
    try {
      const input: TrayInput = {
        code: code.trim().toUpperCase(),
        aliases: aliases
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        name: name.trim(),
        supplierId,
        referencePhotoUrl: initialTray?.referencePhotoUrl ?? null,
        instruments: validInstruments.map((i) => ({ name: i.name.trim(), quantity: i.quantity, critical: i.critical })),
      };
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-4">
      <Card className="space-y-4 p-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">Sieb-Code *</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 font-mono text-sm uppercase outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="z. B. SSW-LEIH-05-01"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
            Alias-Bezeichnungen
          </span>
          <input
            value={aliases}
            onChange={(e) => setAliases(e.target.value)}
            className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="z. B. LEIH 05, LEIH-05"
          />
          <span className="mt-1 block text-[11px] text-ink-400">Kommagetrennt</span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">Bezeichnung *</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="z. B. Schulter-Sieb, Winkelstabile Platten 05"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">Lieferant *</span>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            required
            className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            {suppliers.length === 0 && <option value="">Keine aktiven Lieferanten</option>}
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {!s.active ? ' (inaktiv)' : ''}
              </option>
            ))}
          </select>
        </label>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Instrumente ({expectedCount} Stück)
        </p>
      </div>

      <div className="mt-2 space-y-2">
        {instruments.map((row) => (
          <Card key={row.key} className="p-3">
            <div className="flex items-center gap-2">
              <input
                value={row.name}
                onChange={(e) => updateInstrument(row.key, { name: e.target.value })}
                placeholder="Instrument"
                className="flex-1 rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="button"
                onClick={() => removeInstrument(row.key)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-danger-500 active:bg-danger-50"
                aria-label="Entfernen"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-xl bg-ink-50 px-2 py-1">
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm"
                  onClick={() => updateInstrument(row.key, { quantity: Math.max(1, row.quantity - 1) })}
                >
                  <Minus size={14} />
                </button>
                <span className="w-5 text-center text-sm font-semibold">{row.quantity}</span>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm"
                  onClick={() => updateInstrument(row.key, { quantity: row.quantity + 1 })}
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => updateInstrument(row.key, { critical: !row.critical })}
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium',
                  row.critical ? 'bg-danger-50 text-danger-600' : 'bg-ink-100 text-ink-500',
                ].join(' ')}
              >
                Kritisch
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Button variant="secondary" size="md" icon={<Plus size={16} />} className="mt-2" onClick={addInstrument}>
        Instrument hinzufügen
      </Button>

      {error && <p className="mt-3 rounded-xl bg-danger-50 p-3 text-sm text-danger-600">{error}</p>}

      <Button size="lg" fullWidth className="mt-4" disabled={!canSubmit || saving} onClick={handleSubmit}>
        {saving ? 'Wird gespeichert …' : submitLabel}
      </Button>
    </div>
  );
}

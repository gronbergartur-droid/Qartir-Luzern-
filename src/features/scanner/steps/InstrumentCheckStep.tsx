import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ExtraInstrumentEntry, InstrumentCheckEntry } from '@/types/database';
import { Check, Minus, Pencil, Plus, PlusCircle, Trash2, TriangleAlert, X } from 'lucide-react';
import { useState } from 'react';

interface InstrumentCheckStepProps {
  checks: InstrumentCheckEntry[];
  extras: ExtraInstrumentEntry[];
  expectedCount: number;
  onUpdateCheck: (instrumentId: string, patch: Partial<InstrumentCheckEntry>) => void;
  onAddExtra: (entry: Omit<ExtraInstrumentEntry, 'id'>) => void;
  onRemoveExtra: (id: string) => void;
  onContinue: () => void;
}

export function InstrumentCheckStep({
  checks,
  extras,
  expectedCount,
  onUpdateCheck,
  onAddExtra,
  onRemoveExtra,
  onContinue,
}: InstrumentCheckStepProps) {
  const confirmedCount = checks.filter((c) => c.userConfirmed).length;
  const detectedCount = checks.reduce((sum, c) => sum + (c.userConfirmed ? c.quantityConfirmed : 0), 0)
    + extras.reduce((sum, e) => sum + e.quantity, 0);
  const allConfirmed = confirmedCount === checks.length;

  return (
    <div className="px-4 py-4">
      <Card className="mb-4 grid grid-cols-3 divide-x divide-ink-100 p-0 text-center">
        <Stat label="Erwartet" value={expectedCount} />
        <Stat label="Erkannt" value={detectedCount} tone={detectedCount === expectedCount ? 'success' : 'warning'} />
        <Stat label="Kontrolliert" value={`${confirmedCount}/${checks.length}`} />
      </Card>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
        Instrumenten-Liste (manuelle Kontrolle erforderlich)
      </p>
      <div className="space-y-2">
        {checks.map((check) => (
          <InstrumentRow key={check.instrumentId} check={check} onUpdate={(patch) => onUpdateCheck(check.instrumentId, patch)} />
        ))}
      </div>

      <ExtraInstrumentsSection extras={extras} onAdd={onAddExtra} onRemove={onRemoveExtra} />

      <Button size="lg" fullWidth className="mt-6" disabled={!allConfirmed} onClick={onContinue}>
        {allConfirmed ? 'Weiter zur Bestätigung' : `Noch ${checks.length - confirmedCount} zu kontrollieren`}
      </Button>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: 'success' | 'warning' }) {
  const color = tone === 'success' ? 'text-success-600' : tone === 'warning' ? 'text-warning-600' : 'text-ink-900';
  return (
    <div className="p-3">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-ink-500">{label}</p>
    </div>
  );
}

function InstrumentRow({
  check,
  onUpdate,
}: {
  check: InstrumentCheckEntry;
  onUpdate: (patch: Partial<InstrumentCheckEntry>) => void;
}) {
  if (check.userConfirmed) {
    const short = check.quantityConfirmed < check.quantityExpected;
    return (
      <Card className={['flex items-center justify-between gap-2 p-3', short ? 'border-warning-200 bg-warning-50/40' : ''].join(' ')}>
        <div className="flex items-center gap-2.5">
          <div
            className={[
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
              short ? 'bg-warning-100 text-warning-600' : 'bg-success-100 text-success-600',
            ].join(' ')}
          >
            {short ? <TriangleAlert size={14} /> : <Check size={14} />}
          </div>
          <div>
            <p className="text-sm font-medium text-ink-900">{check.name}</p>
            <p className="text-xs text-ink-500">
              {check.quantityConfirmed} von {check.quantityExpected} bestätigt
              {check.critical && ' · kritisch'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onUpdate({ userConfirmed: false })}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 active:bg-ink-100"
          aria-label="Bearbeiten"
        >
          <Pencil size={15} />
        </button>
      </Card>
    );
  }

  return (
    <Card className="p-3.5">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-ink-900">{check.name}</p>
          <p className="text-xs text-ink-500">Erwartet: {check.quantityExpected}</p>
        </div>
        {check.critical && <Badge tone="danger">Kritisch</Badge>}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-ink-50 px-2 py-1.5">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink-600 shadow-sm active:bg-ink-100"
            onClick={() => onUpdate({ quantityConfirmed: Math.max(0, check.quantityConfirmed - 1) })}
            aria-label="Weniger"
          >
            <Minus size={14} />
          </button>
          <span className="w-5 text-center text-sm font-semibold text-ink-900">{check.quantityConfirmed}</span>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink-600 shadow-sm active:bg-ink-100"
            onClick={() => onUpdate({ quantityConfirmed: Math.min(check.quantityExpected, check.quantityConfirmed + 1) })}
            aria-label="Mehr"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex gap-1.5">
          <Button variant="secondary" size="md" onClick={() => onUpdate({ quantityConfirmed: 0, userConfirmed: true })}>
            Fehlt
          </Button>
          <Button
            variant="success"
            size="md"
            onClick={() =>
              onUpdate({
                quantityConfirmed: check.quantityConfirmed || check.quantityExpected,
                userConfirmed: true,
              })
            }
          >
            Bestätigen
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ExtraInstrumentsSection({
  extras,
  onAdd,
  onRemove,
}: {
  extras: ExtraInstrumentEntry[];
  onAdd: (entry: Omit<ExtraInstrumentEntry, 'id'>) => void;
  onRemove: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="mt-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
        Zusätzliche Instrumente (nicht im Referenz-Sieb)
      </p>

      {extras.length > 0 && (
        <div className="mb-2 space-y-2">
          {extras.map((extra) => (
            <Card key={extra.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium text-ink-900">{extra.name}</p>
                <p className="text-xs text-ink-500">Menge: {extra.quantity}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(extra.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-danger-500 active:bg-danger-50"
                aria-label="Entfernen"
              >
                <Trash2 size={15} />
              </button>
            </Card>
          ))}
        </div>
      )}

      {adding ? (
        <Card className="space-y-2.5 p-3.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bezeichnung des Instruments"
            className="w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-500">Menge</span>
            <div className="flex items-center gap-2 rounded-xl bg-ink-50 px-2 py-1">
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus size={14} />
              </button>
              <span className="w-4 text-center text-sm font-semibold">{quantity}</span>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" size="md" icon={<X size={15} />} onClick={() => setAdding(false)}>
              Abbrechen
            </Button>
            <Button
              size="md"
              disabled={!name.trim()}
              onClick={() => {
                onAdd({ name: name.trim(), quantity, note: null });
                setName('');
                setQuantity(1);
                setAdding(false);
              }}
            >
              Hinzufügen
            </Button>
          </div>
        </Card>
      ) : (
        <Button variant="secondary" size="md" icon={<PlusCircle size={16} />} onClick={() => setAdding(true)}>
          Zusätzliches Instrument erfassen
        </Button>
      )}
    </div>
  );
}

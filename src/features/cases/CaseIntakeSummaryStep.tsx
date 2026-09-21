import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ExtraInstrumentEntry, InstrumentCheckEntry, Supplier, Tray } from '@/types/database';
import { CheckCircle2, CircleAlert, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface CaseIntakeSummaryStepProps {
  tray: Tray;
  supplier: Supplier | null;
  checks: InstrumentCheckEntry[];
  extras: ExtraInstrumentEntry[];
  operationNote: string;
  onOperationNoteChange: (value: string) => void;
  operationDate: string;
  onOperationDateChange: (value: string) => void;
  onConfirmAndOpenCase: () => void;
  saving: boolean;
}

export function CaseIntakeSummaryStep({
  tray,
  supplier,
  checks,
  extras,
  operationNote,
  onOperationNoteChange,
  operationDate,
  onOperationDateChange,
  onConfirmAndOpenCase,
  saving,
}: CaseIntakeSummaryStepProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const missing = checks.filter((c) => c.quantityConfirmed < c.quantityExpected);
  const detectedCount =
    checks.reduce((sum, c) => sum + c.quantityConfirmed, 0) + extras.reduce((s, e) => s + e.quantity, 0);
  const hasDeviations = missing.length > 0 || extras.length > 0;

  return (
    <div className="px-4 py-4">
      <Card className="p-4">
        <p className="font-mono text-xs font-medium text-brand-600">{tray.code}</p>
        <h2 className="text-base font-semibold text-ink-900">{tray.name}</h2>
        {supplier && <p className="mt-0.5 text-xs text-ink-500">{supplier.name}</p>}

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-ink-50 p-3 text-center">
            <p className="text-lg font-bold text-ink-900">{tray.expectedInstrumentCount}</p>
            <p className="text-[11px] text-ink-500">Erwartet</p>
          </div>
          <div className="rounded-xl bg-ink-50 p-3 text-center">
            <p className={`text-lg font-bold ${detectedCount === tray.expectedInstrumentCount ? 'text-success-600' : 'text-warning-600'}`}>
              {detectedCount}
            </p>
            <p className="text-[11px] text-ink-500">Erkannt / bestätigt</p>
          </div>
        </div>
      </Card>

      {!hasDeviations && (
        <Card className="mt-4 flex items-center gap-2.5 border-success-100 bg-success-50 p-3.5">
          <CheckCircle2 size={20} className="shrink-0 text-success-600" />
          <p className="text-sm text-success-700">Vollständig – keine Abweichungen beim Eingang.</p>
        </Card>
      )}

      {missing.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-danger-600">
            <CircleAlert size={14} /> Fehlende Instrumente ({missing.length})
          </p>
          <div className="space-y-1.5">
            {missing.map((m) => (
              <div key={m.instrumentId} className="flex items-center justify-between rounded-lg bg-danger-50 px-3 py-2 text-sm">
                <span className="text-danger-700">{m.name}</span>
                <Badge tone="danger">
                  {m.quantityConfirmed}/{m.quantityExpected}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {extras.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warning-600">
            <CircleAlert size={14} /> Zusätzliche Instrumente ({extras.length})
          </p>
          <div className="space-y-1.5">
            {extras.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg bg-warning-50 px-3 py-2 text-sm">
                <span className="text-warning-700">{e.name}</span>
                <Badge tone="warning">×{e.quantity}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
            Operation (Referenz)
          </span>
          <input
            value={operationNote}
            onChange={(e) => onOperationNoteChange(e.target.value)}
            placeholder="z. B. Saal 3, Pat.-Nr. …"
            className="w-full rounded-xl border border-ink-200 px-3.5 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">OP-Datum</span>
          <input
            type="date"
            value={operationDate}
            onChange={(e) => onOperationDateChange(e.target.value)}
            className="w-full rounded-xl border border-ink-200 px-3.5 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => setAcknowledged((v) => !v)}
        className="mt-4 flex w-full items-start gap-3 rounded-xl border border-ink-200 bg-white p-3.5 text-left"
      >
        <span
          className={[
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2',
            acknowledged ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300',
          ].join(' ')}
        >
          {acknowledged && <CheckCircle2 size={13} />}
        </span>
        <span className="text-sm text-ink-700">
          Ich bestätige den Eingangs-Zustand dieses Leihsiebs und eröffne den Sieb-Fall.
        </span>
      </button>

      <Button
        size="lg"
        fullWidth
        icon={<ShieldCheck size={18} />}
        className="mt-4"
        disabled={!acknowledged || saving}
        onClick={onConfirmAndOpenCase}
      >
        {saving ? 'Wird gespeichert …' : 'Eingang bestätigen & Fall eröffnen'}
      </Button>
    </div>
  );
}

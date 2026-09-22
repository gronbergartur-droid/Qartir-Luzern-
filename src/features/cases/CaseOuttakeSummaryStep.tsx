import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { CaseComparison, Supplier, Tray } from '@/types/database';
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { ComparisonResultView } from './ComparisonResultView';

interface CaseOuttakeSummaryStepProps {
  tray: Tray;
  supplier: Supplier | null;
  comparison: CaseComparison;
  notes: string;
  onNotesChange: (value: string) => void;
  onConfirmAndClose: () => void;
  saving: boolean;
}

export function CaseOuttakeSummaryStep({
  tray,
  supplier,
  comparison,
  notes,
  onNotesChange,
  onConfirmAndClose,
  saving,
}: CaseOuttakeSummaryStepProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center gap-1.5 rounded-xl bg-brand-50 p-3 text-xs text-brand-700">
        <Sparkles size={16} className="shrink-0" />
        <span>Vergleich Eingang ↔ Ausgang – basierend auf den bestätigten Kontrolllisten.</span>
      </div>

      <Card className="p-4">
        <p className="font-mono text-xs font-medium text-brand-600">{tray.code}</p>
        <h2 className="text-base font-semibold text-ink-900">{tray.name}</h2>
        {supplier && <p className="mt-0.5 text-xs text-ink-500">{supplier.name}</p>}
      </Card>

      <div className="mt-4">
        <ComparisonResultView comparison={comparison} />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">
          Bemerkung (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="z. B. Rücksprache mit OP-Team, Grund für Abweichung …"
          className="w-full rounded-xl border border-ink-200 px-3.5 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
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
          Ich bestätige den Ausgangs-Zustand und den obigen Vergleich zum Eingang.
        </span>
      </button>

      <Button
        size="lg"
        fullWidth
        icon={<ShieldCheck size={18} />}
        className="mt-4"
        disabled={!acknowledged || saving}
        onClick={onConfirmAndClose}
      >
        {saving ? 'Wird gespeichert …' : 'Ausgang bestätigen & Fall abschliessen'}
      </Button>
    </div>
  );
}

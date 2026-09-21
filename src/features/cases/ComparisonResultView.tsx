import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { CaseComparison } from '@/types/database';
import { ArrowRight, CheckCircle2, CircleAlert, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

/** Read-only rendering of a CaseComparison, shared between the live outtake summary and the saved case detail view. */
export function ComparisonResultView({ comparison }: { comparison: CaseComparison }) {
  const { instrumentDeltas, extraDeltas, substitutionSuggestions, hasDeviations } = comparison;
  const missing = instrumentDeltas.filter((d) => d.delta < 0);
  const surplus = instrumentDeltas.filter((d) => d.delta > 0);
  const newExtras = extraDeltas.filter((d) => d.outtakeQuantity > d.intakeQuantity);
  const resolvedExtras = extraDeltas.filter((d) => d.outtakeQuantity < d.intakeQuantity);

  return (
    <div>
      {!hasDeviations && (
        <Card className="flex items-center gap-2.5 border-success-100 bg-success-50 p-3.5">
          <CheckCircle2 size={20} className="shrink-0 text-success-600" />
          <p className="text-sm text-success-700">Kein Unterschied zum Eingang festgestellt.</p>
        </Card>
      )}

      {missing.length > 0 && (
        <Section title={`Fehlende Instrumente (${missing.length})`} tone="danger">
          {missing.map((d) => (
            <Row key={d.instrumentId} label={d.name} value={`${d.outtakeQuantity}/${d.intakeQuantity}`} tone="danger" />
          ))}
        </Section>
      )}

      {surplus.length > 0 && (
        <Section title={`Mengenüberschuss (${surplus.length})`} tone="warning">
          {surplus.map((d) => (
            <Row key={d.instrumentId} label={d.name} value={`${d.outtakeQuantity}/${d.intakeQuantity}`} tone="warning" />
          ))}
        </Section>
      )}

      {newExtras.length > 0 && (
        <Section title={`Neue zusätzliche Instrumente (${newExtras.length})`} tone="warning">
          {newExtras.map((d) => (
            <Row key={d.name} label={d.name} value={`+${d.outtakeQuantity - d.intakeQuantity}`} tone="warning" />
          ))}
        </Section>
      )}

      {resolvedExtras.length > 0 && (
        <Section title={`Entfernte zusätzliche Instrumente (${resolvedExtras.length})`} tone="neutral">
          {resolvedExtras.map((d) => (
            <Row key={d.name} label={d.name} value={`-${d.intakeQuantity - d.outtakeQuantity}`} tone="neutral" />
          ))}
        </Section>
      )}

      {substitutionSuggestions.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600">
            <Sparkles size={14} /> Mögliche Verwechslung (KI-Vorschlag)
          </p>
          <div className="space-y-1.5">
            {substitutionSuggestions.map((s) => (
              <div key={`${s.missingName}-${s.extraName}`} className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                <div className="flex items-center gap-1.5">
                  <span>{s.missingName}</span>
                  <ArrowRight size={12} className="shrink-0" />
                  <span className="font-medium">{s.extraName}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-brand-500">
                  Namensähnlichkeit {Math.round(s.similarity * 100)}% – bitte prüfen, nicht automatisch übernommen.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, tone, children }: { title: string; tone: 'danger' | 'warning' | 'neutral'; children: ReactNode }) {
  return (
    <div className="mt-4">
      <p
        className={[
          'mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide',
          tone === 'danger' ? 'text-danger-600' : tone === 'warning' ? 'text-warning-600' : 'text-ink-500',
        ].join(' ')}
      >
        <CircleAlert size={14} /> {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: 'danger' | 'warning' | 'neutral' }) {
  const bg = tone === 'danger' ? 'bg-danger-50' : tone === 'warning' ? 'bg-warning-50' : 'bg-ink-50';
  const text = tone === 'danger' ? 'text-danger-700' : tone === 'warning' ? 'text-warning-700' : 'text-ink-600';
  return (
    <div className={`flex items-center justify-between rounded-lg ${bg} px-3 py-2 text-sm`}>
      <span className={text}>{label}</span>
      <Badge tone={tone === 'neutral' ? 'neutral' : tone}>{value}</Badge>
    </div>
  );
}

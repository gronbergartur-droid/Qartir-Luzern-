import { STEP_ORDER, type ScannerStep } from '../scannerTypes';

const VISIBLE_STEPS = STEP_ORDER.filter((s) => s !== 'recognizing' && s !== 'done');

export function StepProgress({ step }: { step: ScannerStep }) {
  const effectiveStep: ScannerStep =
    step === 'recognizing' ? 'capture' : step === 'unmatched' ? 'identify' : step;
  const currentIndex = VISIBLE_STEPS.indexOf(effectiveStep as (typeof VISIBLE_STEPS)[number]);

  return (
    <div className="flex items-center gap-1.5 px-4 pb-3 pt-1">
      {VISIBLE_STEPS.map((s, i) => (
        <span
          key={s}
          className={[
            'h-1.5 flex-1 rounded-full transition-colors',
            i <= currentIndex ? 'bg-brand-600' : 'bg-ink-200',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

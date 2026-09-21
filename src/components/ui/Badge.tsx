import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  brand: 'bg-brand-50 text-brand-700',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        toneClasses[tone],
      ].join(' ')}
    >
      {children}
    </span>
  );
}

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Supplier, SupplierInput } from '@/types/database';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { useState } from 'react';

interface SupplierFormProps {
  initial?: Supplier;
  onSubmit: (input: SupplierInput) => Promise<void>;
  submitLabel: string;
}

function toFormState(initial?: Supplier) {
  return {
    name: initial?.name ?? '',
    shortCode: initial?.shortCode ?? '',
    location: initial?.location ?? '',
    specialties: initial?.specialties.join(', ') ?? '',
    loanServiceConfirmed: initial?.loanServiceConfirmed ?? true,
    loanServiceNote: initial?.loanServiceNote ?? '',
    contactPhone: initial?.contactPhone ?? '',
    contactEmail: initial?.contactEmail ?? '',
    contactNote: initial?.contactNote ?? '',
    source: initial?.source ?? '',
  };
}

export function SupplierForm({ initial, onSubmit, submitLabel }: SupplierFormProps) {
  const [form, setForm] = useState(toFormState(initial));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const field = <K extends keyof typeof form>(key: K) => ({
    value: form[key] as string,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const canSubmit = form.name.trim().length > 0 && form.shortCode.trim().length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setError(null);
    setSaving(true);
    try {
      const input: SupplierInput = {
        name: form.name.trim(),
        shortCode: form.shortCode.trim().toUpperCase(),
        location: form.location.trim() || null,
        specialties: form.specialties
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        loanServiceConfirmed: form.loanServiceConfirmed,
        loanServiceNote: form.loanServiceNote.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
        contactEmail: form.contactEmail.trim() || null,
        contactNote: form.contactNote.trim() || null,
        source: form.source.trim() || null,
        logoUrl: initial?.logoUrl ?? null,
      };
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-4">
      <Card className="space-y-4 p-4">
        <Field label="Name / Unternehmen *">
          <input {...field('name')} required className={inputClass} placeholder="z. B. Stryker Osteonics AG" />
        </Field>

        <Field label="Kürzel *">
          <input
            {...field('shortCode')}
            required
            maxLength={8}
            className={`${inputClass} font-mono uppercase`}
            placeholder="z. B. STRY"
          />
        </Field>

        <Field label="Standort (Schweiz)">
          <input {...field('location')} className={inputClass} placeholder="z. B. Biberist, SO" />
        </Field>

        <Field label="Fachgebiete / typische Sets" hint="Kommagetrennt">
          <input {...field('specialties')} className={inputClass} placeholder="Hüfte, Knie, Wirbelsäule" />
        </Field>

        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, loanServiceConfirmed: !f.loanServiceConfirmed }))}
          className="flex w-full items-center gap-3 rounded-xl border border-ink-200 p-3 text-left"
        >
          <span
            className={[
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2',
              form.loanServiceConfirmed ? 'border-brand-600 bg-brand-600' : 'border-ink-300',
            ].join(' ')}
          >
            {form.loanServiceConfirmed && <span className="h-2 w-2 rounded-sm bg-white" />}
          </span>
          <span className="text-sm text-ink-700">Leihservice bestätigt</span>
        </button>

        <Field label="Beschreibung Leihservice">
          <input {...field('loanServiceNote')} className={inputClass} placeholder="z. B. ELSA European Loan Service" />
        </Field>

        <Field label="Telefon">
          <input {...field('contactPhone')} type="tel" className={inputClass} placeholder="+41 …" />
        </Field>

        <Field label="E-Mail">
          <input {...field('contactEmail')} type="email" className={inputClass} placeholder="order@…" />
        </Field>

        <Field label="Adresse / Hinweis">
          <textarea {...field('contactNote')} rows={2} className={inputClass} />
        </Field>

        <Field label="Quelle" hint="Zur Nachvollziehbarkeit der Daten">
          <input {...field('source')} className={inputClass} />
        </Field>
      </Card>

      {error && <p className="mt-3 rounded-xl bg-danger-50 p-3 text-sm text-danger-600">{error}</p>}

      <Button type="submit" size="lg" fullWidth className="mt-4" disabled={!canSubmit || saving}>
        {saving ? 'Wird gespeichert …' : submitLabel}
      </Button>
    </form>
  );
}

const inputClass =
  'w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-400">{hint}</span>}
    </label>
  );
}

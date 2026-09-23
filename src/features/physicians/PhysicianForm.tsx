import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { PhysicianInput } from '@/types/database';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { useState } from 'react';

const COMMON_DEPARTMENTS = ['Orthopädie', 'Gynäkologie', 'Chirurgie', 'Handchirurgie', 'HNO/Kieferchirurgie', 'Urologie'];

interface PhysicianFormProps {
  onSubmit: (input: PhysicianInput) => Promise<void>;
  submitLabel: string;
}

export function PhysicianForm({ onSubmit, submitLabel }: PhysicianFormProps) {
  const [form, setForm] = useState({
    name: '',
    department: '',
    mobilePhone: '',
    practicePhone: '',
    email: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const field = <K extends keyof typeof form>(key: K) => ({
    value: form[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const canSubmit = form.name.trim().length > 0 && form.department.trim().length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setError(null);
    setSaving(true);
    try {
      const input: PhysicianInput = {
        name: form.name.trim(),
        department: form.department.trim(),
        mobilePhone: form.mobilePhone.trim() || null,
        practicePhone: form.practicePhone.trim() || null,
        email: form.email.trim() || null,
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
        <Field label="Name *">
          <input {...field('name')} required className={inputClass} placeholder="z. B. Dr. Martin Röthlisberger" />
        </Field>

        <Field label="Fachbereich *" hint="z. B. Orthopädie, Gynäkologie">
          <input {...field('department')} required list="physician-departments" className={inputClass} placeholder="Fachbereich" />
          <datalist id="physician-departments">
            {COMMON_DEPARTMENTS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </Field>

        <Field label="Mobil">
          <input {...field('mobilePhone')} type="tel" className={inputClass} placeholder="079 …" />
        </Field>

        <Field label="Praxis-Telefon">
          <input {...field('practicePhone')} type="tel" className={inputClass} placeholder="041 …" />
        </Field>

        <Field label="E-Mail">
          <input {...field('email')} type="email" className={inputClass} placeholder="name@praxis.ch" />
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

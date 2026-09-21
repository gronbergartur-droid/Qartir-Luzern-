import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import type { LucideIcon } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  icon: LucideIcon;
  description: string;
  plannedFeatures: string[];
}

export function ComingSoonPage({ title, icon: Icon, description, plannedFeatures }: ComingSoonPageProps) {
  return (
    <div>
      <TopBar title={title} showBack />
      <div className="px-4 py-6">
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Icon size={28} />
          </div>
          <p className="text-base font-semibold text-ink-900">Bald verfügbar</p>
          <p className="text-sm text-ink-500">{description}</p>
        </Card>

        <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-ink-500">
          Geplanter Funktionsumfang
        </h2>
        <ul className="space-y-2">
          {plannedFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-2 rounded-xl bg-white p-3 text-sm text-ink-700 shadow-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

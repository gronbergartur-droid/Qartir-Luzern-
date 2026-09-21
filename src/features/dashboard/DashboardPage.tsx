import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  ArrowLeftRight,
  ClipboardList,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const modules = [
  {
    to: '/historie',
    icon: ClipboardList,
    title: 'Sieb-Historie',
    description: 'Alle durchgeführten Leih-Sieb-Kontrollen',
    status: 'active' as const,
  },
  {
    to: '/audit',
    icon: ShieldCheck,
    title: 'Audit-Log',
    description: 'Lückenlose Nachverfolgung aller Aktionen',
    status: 'active' as const,
  },
  {
    to: '/lieferanten',
    icon: Truck,
    title: 'Lieferantenverwaltung',
    description: 'Kontakte, Konditionen und Sieb-Zuordnung',
    status: 'soon' as const,
  },
  {
    to: '/vergleich',
    icon: ArrowLeftRight,
    title: 'Vorher/Nachher-Vergleich',
    description: 'Sieb-Zustand vor und nach der Operation',
    status: 'soon' as const,
  },
];

export function DashboardPage() {
  return (
    <div className="px-4 pt-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-brand-600">AEMP · Instrumentenmanagement</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900">IDM Mobile</h1>
      </div>

      <Link to="/scanner" className="block">
        <Card className="relative overflow-hidden border-brand-600 bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white active:opacity-95">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <ScanLine size={24} />
            </div>
            <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white">
              Modul 1
            </span>
          </div>
          <h2 className="mt-4 text-lg font-semibold">LEIH-SIEB SCANNER</h2>
          <p className="mt-1 text-sm text-brand-100">
            Leihsieb fotografieren, Barcode/QR &amp; Text erkennen, Instrumente kontrollieren.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white">
            Kontrolle starten →
          </span>
        </Card>
      </Link>

      <div className="mt-6 flex items-center gap-1.5 text-xs text-ink-500">
        <Sparkles size={14} className="text-brand-500" />
        <span>KI-gestützte Erkennung – Ergebnisse müssen manuell bestätigt werden.</span>
      </div>

      <h3 className="mb-3 mt-7 text-sm font-semibold uppercase tracking-wide text-ink-500">
        Weitere Module
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const disabled = mod.status === 'soon';
          const content = (
            <Card
              className={[
                'flex h-full flex-col gap-2.5 p-4',
                disabled ? 'opacity-60' : 'active:bg-ink-50',
              ].join(' ')}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">{mod.title}</p>
                <p className="mt-0.5 text-xs text-ink-500">{mod.description}</p>
              </div>
              {disabled && (
                <Badge tone="neutral">
                  <span>Bald verfügbar</span>
                </Badge>
              )}
            </Card>
          );

          return disabled ? (
            <div key={mod.to} aria-disabled className="cursor-not-allowed">
              {content}
            </div>
          ) : (
            <Link key={mod.to} to={mod.to}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

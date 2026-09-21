import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Check, Star } from 'lucide-react';

interface Tier {
  name: string;
  price: string;
  audience: string;
  features: string[];
  setup: string;
  recommended?: boolean;
}

const tiers: Tier[] = [
  {
    name: 'IDM START',
    price: 'CHF 149',
    audience: 'Kleine Klinik / einzelner Bereich',
    features: [
      'LEIH-Sieb-Verwaltung',
      'Lieferanten',
      'QR-/Barcode',
      'Foto-Dokumentation',
      'Basis-KI',
      'Historie',
      'Dashboard',
    ],
    setup: 'CHF 490',
  },
  {
    name: 'IDM PROFESSIONAL',
    price: 'CHF 299',
    audience: 'AEMP / OP / mehrere Benutzer',
    features: [
      'Alles aus START',
      'Erweiterte KI-Fotoanalyse',
      'Automatische Lieferantenzuordnung',
      'Audit Trail',
      'Reports',
      'Benutzerverwaltung',
    ],
    setup: 'CHF 990',
    recommended: true,
  },
  {
    name: 'IDM HOSPITAL',
    price: 'CHF 599',
    audience: 'Spital / mehrere Abteilungen',
    features: [
      'Alles aus PROFESSIONAL',
      'Mehrere OP-/AEMP-Bereiche',
      'Zentrale Administration',
      'Erweiterte Reports',
      'API',
      'SLA-Support',
    ],
    setup: 'ab CHF 2\'500',
  },
  {
    name: 'IDM ENTERPRISE',
    price: "ab CHF 1'200",
    audience: 'Grosses Spital / Spitalgruppe',
    features: [
      'Individuelle Lösung',
      'Integrationen',
      'API',
      'Zentrale Administration',
      'Individuelle Prozesse und Support',
    ],
    setup: 'individuell',
  },
];

const platformFeatures = [
  'LEIH-Sieb-Verwaltung',
  'Lieferantenverwaltung',
  'QR-/Barcode-Scanning',
  'Foto beim Eingang',
  'Foto nach der Operation',
  'KI-Vorher-/Nachher-Vergleich',
  'Erkennung fehlender, zusätzlicher oder falscher Instrumente',
  'Automatische Lieferantenzuordnung',
  'Sieb-Historie und Lieferanten-Historie',
  'Audit Trail mit Datum, Uhrzeit und Benutzer',
  'Dashboard und Statusübersicht',
  'Benutzer- und Rollenverwaltung',
  'Cloud-Speicherung',
  'Reports und Dokumentation',
  'Support',
];

export function PricingPage() {
  return (
    <div>
      <TopBar title="Tarife & Preise" subtitle="Schweizer B2B-SaaS-Modell" showBack />

      <div className="px-4 py-4">
        <p className="text-sm text-ink-600">
          IDM Mobile LEIH-SIEB wird als SaaS-Lösung für Schweizer Kliniken, Spitäler, OP-Bereiche und
          AEMP angeboten – Preise pro Monat, zzgl. einmaliger Einrichtung.
        </p>

        <div className="mt-5 space-y-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={[
                'p-4',
                tier.recommended ? 'border-brand-600 ring-2 ring-brand-100' : '',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-ink-900">{tier.name}</p>
                    {tier.recommended && <Star size={14} className="fill-brand-500 text-brand-500" />}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">{tier.audience}</p>
                </div>
                {tier.recommended && <Badge tone="brand">Empfohlen</Badge>}
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-ink-900">{tier.price}</span>
                <span className="text-xs text-ink-500">/ Monat</span>
              </div>

              <ul className="mt-3 space-y-1.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-1.5 text-sm text-ink-700">
                    <Check size={14} className="mt-0.5 shrink-0 text-success-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-2.5 text-xs">
                <span className="text-ink-500">Einmalige Einrichtung</span>
                <span className="font-medium text-ink-700">{tier.setup}</span>
              </div>
            </Card>
          ))}
        </div>

        <h2 className="mb-3 mt-7 text-sm font-semibold uppercase tracking-wide text-ink-500">
          Leistungen der IDM-Plattform
        </h2>
        <Card className="p-4">
          <ul className="grid grid-cols-1 gap-2 text-sm text-ink-700">
            {platformFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-1.5">
                <Check size={14} className="mt-0.5 shrink-0 text-success-600" />
                {feature}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

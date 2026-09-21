import { ComingSoonPage } from '@/features/comingsoon/ComingSoonPage';
import { Truck } from 'lucide-react';

export function SuppliersPage() {
  return (
    <ComingSoonPage
      title="Lieferantenverwaltung"
      icon={Truck}
      description="Stammdaten aller Leihsieb-Lieferanten zentral verwalten – vorbereitet für Supabase."
      plannedFeatures={[
        'Lieferanten anlegen, bearbeiten und deaktivieren',
        'Kontaktpersonen und Kommunikationswege je Lieferant',
        'Zuordnung von Sieb-Codes und Alias-Bezeichnungen',
        'Rückverfolgung: welcher Lieferant lieferte welches Sieb wann',
      ]}
    />
  );
}

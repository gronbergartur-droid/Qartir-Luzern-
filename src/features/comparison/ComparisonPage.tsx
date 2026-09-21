import { ComingSoonPage } from '@/features/comingsoon/ComingSoonPage';
import { ArrowLeftRight } from 'lucide-react';

export function ComparisonPage() {
  return (
    <ComingSoonPage
      title="Vorher/Nachher-Vergleich"
      icon={ArrowLeftRight}
      description="Sieb-Zustand vor und nach der Operation automatisiert gegenüberstellen."
      plannedFeatures={[
        'Zweiter Scan nach der Operation, verknüpft mit dem Ausgangs-Scan',
        'Automatischer Abgleich: fehlende, beschädigte oder zusätzliche Instrumente',
        'Bildvergleich nebeneinander (vorher/nachher)',
        'Direkte Übergabe kritischer Abweichungen an das Audit-Log',
      ]}
    />
  );
}

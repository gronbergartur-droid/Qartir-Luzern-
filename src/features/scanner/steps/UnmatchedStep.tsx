import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Supplier, Tray } from '@/types/database';
import { SearchX } from 'lucide-react';

interface UnmatchedStepProps {
  identifier: string;
  trays: Tray[];
  suppliers: Supplier[];
  onSelectTray: (tray: Tray) => void;
  onRetake: () => void;
}

export function UnmatchedStep({ identifier, trays, suppliers, onSelectTray, onRetake }: UnmatchedStepProps) {
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? 'Unbekannt';

  return (
    <div className="px-4 py-6">
      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-50 text-warning-600">
          <SearchX size={24} />
        </div>
        <p className="text-base font-semibold text-ink-900">Kein Treffer für „{identifier}“</p>
        <p className="text-sm text-ink-500">
          Der Code wurde in der Referenzdatenbank nicht gefunden. Bitte Sieb manuell auswählen oder
          erneut fotografieren.
        </p>
      </Card>

      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-500">
        Sieb manuell auswählen
      </p>
      <div className="space-y-2">
        {trays.map((tray) => (
          <button key={tray.id} type="button" className="block w-full text-left" onClick={() => onSelectTray(tray)}>
            <Card className="p-3.5 active:bg-ink-50">
              <p className="font-mono text-sm font-semibold text-ink-900">{tray.code}</p>
              <p className="text-sm text-ink-600">{tray.name}</p>
              <p className="mt-0.5 text-xs text-ink-400">{supplierName(tray.supplierId)}</p>
            </Card>
          </button>
        ))}
      </div>

      <Button variant="ghost" size="md" fullWidth className="mt-6" onClick={onRetake}>
        Foto erneut aufnehmen
      </Button>
    </div>
  );
}

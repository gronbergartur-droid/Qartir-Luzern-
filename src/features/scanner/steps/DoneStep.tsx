import { Button } from '@/components/ui/Button';
import { PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DoneStep({ scanId, onStartNew }: { scanId: string; onStartNew: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-600">
        <PartyPopper size={30} />
      </div>
      <h2 className="text-lg font-semibold text-ink-900">Kontrolle gespeichert</h2>
      <p className="text-sm text-ink-500">
        Der Scan wurde in der Sieb-Historie abgelegt und im Audit-Log protokolliert.
      </p>

      <div className="mt-4 flex w-full flex-col gap-2">
        <Button size="lg" fullWidth onClick={() => navigate(`/historie/${scanId}`)}>
          Details anzeigen
        </Button>
        <Button variant="secondary" size="lg" fullWidth onClick={onStartNew}>
          Neuen Scan starten
        </Button>
      </div>
    </div>
  );
}

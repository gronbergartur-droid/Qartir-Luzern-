import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Supplier, Tray } from '@/types/database';
import { AlertTriangle, CheckCircle2, ImageOff, Package, Truck } from 'lucide-react';

interface TrayMatchedStepProps {
  tray: Tray;
  supplier: Supplier | null;
  imageDataUrl: string | null;
  onContinue: () => void;
  onWrongMatch: () => void;
  /** Set when this tray was assumed (e.g. case-outtake) rather than freshly looked up, and the scanned code didn't confirm it. */
  mismatchWarning?: string;
}

export function TrayMatchedStep({
  tray,
  supplier,
  imageDataUrl,
  onContinue,
  onWrongMatch,
  mismatchWarning,
}: TrayMatchedStepProps) {
  return (
    <div className="px-4 py-4">
      {mismatchWarning ? (
        <div className="mb-4 flex items-center gap-1.5 rounded-xl bg-warning-50 p-3 text-xs text-warning-600">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{mismatchWarning}</span>
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-1.5 rounded-xl bg-success-50 p-3 text-xs text-success-700">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>Sieb in der Referenzdatenbank gefunden.</span>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-2 gap-px bg-ink-100">
          <figure className="bg-ink-50 p-2">
            <figcaption className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-400">
              Aufnahme
            </figcaption>
            {imageDataUrl ? (
              <img src={imageDataUrl} alt="Aufgenommenes Leihsieb" className="aspect-square w-full rounded-lg object-cover" />
            ) : (
              <PlaceholderImage />
            )}
          </figure>
          <figure className="bg-ink-50 p-2">
            <figcaption className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-400">
              Referenzfoto
            </figcaption>
            {tray.referencePhotoUrl ? (
              <img src={tray.referencePhotoUrl} alt={`Referenz ${tray.code}`} className="aspect-square w-full rounded-lg object-cover" />
            ) : (
              <PlaceholderImage />
            )}
          </figure>
        </div>

        <div className="p-4">
          <p className="font-mono text-xs font-medium text-brand-600">{tray.code}</p>
          <h2 className="mt-0.5 text-base font-semibold text-ink-900">{tray.name}</h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {supplier && (
              <Badge tone="brand">
                <Truck size={12} />
                {supplier.name}
              </Badge>
            )}
            <Badge tone="neutral">
              <Package size={12} />
              {tray.expectedInstrumentCount} Instrumente erwartet
            </Badge>
          </div>

          {tray.aliases.length > 0 && (
            <p className="mt-3 text-xs text-ink-400">Alias: {tray.aliases.join(', ')}</p>
          )}
        </div>
      </Card>

      <div className="mt-6 flex flex-col gap-2">
        <Button size="lg" fullWidth onClick={onContinue}>
          Weiter zur Instrumenten-Kontrolle
        </Button>
        <Button variant="ghost" size="md" fullWidth onClick={onWrongMatch}>
          Falsches Sieb – Code korrigieren
        </Button>
      </div>
    </div>
  );
}

function PlaceholderImage() {
  return (
    <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-ink-100 text-ink-300">
      <ImageOff size={22} />
    </div>
  );
}

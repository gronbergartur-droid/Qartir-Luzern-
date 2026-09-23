import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { RecognitionCandidate, RecognitionResult } from '@/types/database';
import { AlertCircle, Barcode, QrCode, ScanText } from 'lucide-react';
import { useState } from 'react';

interface IdentifyStepProps {
  imageDataUrl: string | null;
  additionalImageDataUrls?: string[];
  recognition: RecognitionResult;
  onConfirm: (identifier: string) => void;
  onRetake: () => void;
}

const sourceMeta: Record<RecognitionCandidate['source'], { label: string; icon: typeof Barcode }> = {
  barcode: { label: 'Barcode', icon: Barcode },
  qr: { label: 'QR-Code', icon: QrCode },
  ocr: { label: 'Texterkennung', icon: ScanText },
};

export function IdentifyStep({
  imageDataUrl,
  additionalImageDataUrls,
  recognition,
  onConfirm,
  onRetake,
}: IdentifyStepProps) {
  const { candidateIdentifiers } = recognition;
  const [selected, setSelected] = useState<string | null>(candidateIdentifiers[0]?.value ?? null);
  const [manualValue, setManualValue] = useState('');
  const [useManual, setUseManual] = useState(candidateIdentifiers.length === 0);

  const finalValue = useManual ? manualValue.trim() : selected;

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center gap-1.5 rounded-xl bg-brand-50 p-3 text-xs text-brand-700">
        <AlertCircle size={16} className="shrink-0" />
        <span>KI-Vorschlag – bitte den erkannten Sieb-Code prüfen und bestätigen.</span>
      </div>

      {imageDataUrl && (
        <img
          src={imageDataUrl}
          alt="Aufgenommenes Leihsieb"
          className="mb-4 h-40 w-full rounded-xl object-cover"
        />
      )}

      {additionalImageDataUrls && additionalImageDataUrls.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          {additionalImageDataUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Weiteres Foto ${index + 1}`}
              className="h-20 w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      {candidateIdentifiers.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Erkannte Kandidaten
          </p>
          {candidateIdentifiers.map((candidate) => {
            const meta = sourceMeta[candidate.source];
            const Icon = meta.icon;
            const isSelected = !useManual && selected === candidate.value;
            return (
              <button
                key={`${candidate.source}-${candidate.value}`}
                type="button"
                onClick={() => {
                  setUseManual(false);
                  setSelected(candidate.value);
                }}
                className="block w-full text-left"
              >
                <Card
                  className={[
                    'flex items-center justify-between gap-3 p-3.5',
                    isSelected ? 'border-brand-500 ring-2 ring-brand-100' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={[
                        'flex h-9 w-9 items-center justify-center rounded-lg',
                        isSelected ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500',
                      ].join(' ')}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold text-ink-900">{candidate.value}</p>
                      <p className="text-xs text-ink-500">{meta.label}</p>
                    </div>
                  </div>
                  <Badge tone={candidate.confidence >= 0.8 ? 'success' : 'warning'}>
                    {Math.round(candidate.confidence * 100)}%
                  </Badge>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {candidateIdentifiers.length === 0 && (
        <Card className="mb-4 p-4 text-sm text-ink-600">
          Es konnte kein Sieb-Code automatisch erkannt werden. Bitte Code manuell eingeben oder das
          Foto erneut aufnehmen.
        </Card>
      )}

      <button
        type="button"
        onClick={() => setUseManual((v) => !v)}
        className="mb-2 text-xs font-medium text-brand-600 underline-offset-2 active:underline"
      >
        {useManual ? 'Kandidaten verwenden' : 'Code manuell eingeben'}
      </button>

      {useManual && (
        <input
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          placeholder="z. B. SSW-LEIH-04-02"
          className="mb-2 w-full rounded-xl border border-ink-200 px-3.5 py-3 font-mono text-sm uppercase tracking-wide outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      )}

      {recognition.ocrText && (
        <details className="mb-4 rounded-xl bg-ink-100 p-3 text-xs text-ink-600">
          <summary className="cursor-pointer select-none font-medium text-ink-700">
            Erkannten Rohtext anzeigen
          </summary>
          <p className="mt-2 whitespace-pre-wrap font-mono">{recognition.ocrText}</p>
        </details>
      )}

      <div className="mt-2 flex flex-col gap-2">
        <Button
          size="lg"
          fullWidth
          disabled={!finalValue}
          onClick={() => finalValue && onConfirm(finalValue)}
        >
          Sieb-Code bestätigen
        </Button>
        <Button variant="ghost" size="md" fullWidth onClick={onRetake}>
          Foto erneut aufnehmen
        </Button>
      </div>
    </div>
  );
}

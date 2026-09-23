import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PackageCheck, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraCapture } from './CameraCapture';
import { ScannerFlow } from './ScannerFlow';

const MIN_PHOTOS = 2;
const MAX_PHOTOS = 10;

type SetStep = 'capturing' | 'adding' | 'processing' | 'summary';

/**
 * A delivered "SET" is a single shipment containing several different
 * Siebe (not several photos of the same one). This screen collects
 * 2-10 photos upfront (camera or "Aus Fotos wählen" per photo), then runs
 * the existing single-Sieb ScannerFlow once per photo in sequence - each
 * photo gets its own recognition, match and instrument check, exactly like
 * an individual scan, just chained together with progress shown.
 */
export function SetScannerFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<SetStep>('capturing');
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleCapture = (dataUrl: string) => {
    setPhotos((prev) => [...prev, dataUrl]);
    setStep('capturing');
  };

  const handleRemove = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartProcessing = () => {
    setCurrentIndex(0);
    setStep('processing');
  };

  const handleSetItemDone = () => {
    if (currentIndex + 1 < photos.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setStep('summary');
    }
  };

  if (step === 'adding') {
    return (
      <div>
        <TopBar title="Foto aufnehmen" subtitle={`Sieb ${photos.length + 1} im SET`} showBack onBack={() => setStep('capturing')} />
        <div className="px-4 py-4">
          <CameraCapture onCapture={handleCapture} />
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <ScannerFlow
        key={currentIndex}
        mode={{ kind: 'standalone' }}
        initialImageDataUrl={photos[currentIndex]}
        setProgress={{ index: currentIndex + 1, total: photos.length }}
        onSetItemDone={handleSetItemDone}
      />
    );
  }

  if (step === 'summary') {
    return (
      <div>
        <TopBar title="SET abgeschlossen" />
        <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-600">
            <PackageCheck size={30} />
          </div>
          <h2 className="text-lg font-semibold text-ink-900">SET erfasst</h2>
          <p className="text-sm text-ink-500">
            {photos.length} Siebe wurden einzeln kontrolliert, gespeichert und im Audit-Log protokolliert.
          </p>
          <div className="mt-4 flex w-full flex-col gap-2">
            <Button size="lg" fullWidth onClick={() => navigate('/historie')}>
              Zur Sieb-Historie
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => {
                setPhotos([]);
                setCurrentIndex(0);
                setStep('capturing');
              }}
            >
              Neues SET erfassen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // step === 'capturing'
  return (
    <div>
      <TopBar title="Sieb-SET erfassen" subtitle={`${photos.length} von ${MIN_PHOTOS}-${MAX_PHOTOS} Fotos`} showBack />
      <div className="px-4 py-4">
        <p className="mb-4 text-sm text-ink-600">
          Für ein SET (mehrere Leihsiebe in einer Lieferung) für jedes Sieb ein eigenes Foto aufnehmen - danach
          wird jedes Foto einzeln erkannt, zugeordnet und kontrolliert.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square overflow-hidden rounded-xl bg-ink-100">
              <img src={photo} alt={`Sieb ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white active:bg-black/80"
                aria-label={`Foto ${index + 1} entfernen`}
              >
                <Trash2 size={13} />
              </button>
              <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {index + 1}
              </span>
            </div>
          ))}

          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => setStep('adding')}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-200 text-ink-400 active:bg-ink-50"
            >
              <Plus size={22} />
              <span className="text-[11px] font-medium">Foto</span>
            </button>
          )}
        </div>

        {photos.length > 0 && photos.length < MIN_PHOTOS && (
          <p className="mt-3 text-xs text-ink-500">Mindestens {MIN_PHOTOS} Fotos für ein SET nötig.</p>
        )}

        <Card className="mt-4 p-3.5">
          <Button size="lg" fullWidth disabled={photos.length < MIN_PHOTOS} onClick={handleStartProcessing}>
            {photos.length >= MIN_PHOTOS
              ? `${photos.length} Siebe kontrollieren`
              : `Weitere Fotos hinzufügen (${photos.length}/${MIN_PHOTOS})`}
          </Button>
        </Card>
      </div>
    </div>
  );
}
